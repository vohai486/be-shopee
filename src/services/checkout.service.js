"use strict";
const {
  findCartById,
  findCartByUserId,
} = require("../models/repositories/cart.repo");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const { checkProductByServer } = require("../models/repositories/product.repo");
const VoucherService = require("./voucher.service");
const {
  reservationInventory,
  cancelReservationInventory,
} = require("../models/repositories/inventory.repo");
const orderModel = require("../models/order.model");
const CartService = require("./cart.service");
const productModel = require("../models/product.model");
const { Types } = require("mongoose");
const { STATUS_ORDER, STATUS_NOTIFICATION } = require("../constants/status");
const { findOneAndUpdate } = require("../models/repositories/order.repo");
const { generateFeeShip, convertToObjectIdMongo } = require("../utils");
const voucherModel = require("../models/voucher.model");
const { pushNotiToSystem } = require("./notification.service");
const moment = require("moment/moment");
const { createOrders } = require("../models/repositories/checkout");
var jwt = require("jsonwebtoken");
const paymentModel = require("../models/payment.model");
/**
 * {
 *  cartId,
 *  userId,
 *  shop_order_ids:[
 *      {
 *          shopId,
 *          shop_vouchers:[
 *              {
 *                  shopId,
 *                  voucherId,
 *                  codeId
 *              }
 *          ],
 *          item_products:[
 *              {
 *                  price,
 *                  quantity,
 *                  productId
 *              }
 *          ]
 *      }
 *  ]
 * }
 */
class CheckoutService {
  static checkoutReview = async ({
    cartId,
    userId,
    shop_order_ids,
    user_address,
  }) => {
    const foundCart = await findCartById(cartId);
    if (!foundCart) throw new NotFoundRequestError("Cart does not exists");
    if (!user_address?._id) throw new BadRequestError("Request error");
    const checkout_order = {
        totalPrice: 0, //tồng tiền hàng
        feeShip: 0, //phi vận chuyển
        totalDiscount: 0, // tổng tiền discount giảm giá
        totalCheckout: 0, // tổng thành toán
      },
      shop_order_ids_new = [];

    for (let i = 0; i < shop_order_ids.length; i++) {
      const {
        shopId,
        shop_discounts = [],
        items_products = [],
      } = shop_order_ids[i];
      const checkProductServer = await checkProductByServer(items_products);
      if (checkProductServer.length !== items_products.length)
        throw new BadRequestError("order wrong!!!");
      // tổng tiền đơn hàng

      const checkoutPrice = checkProductServer.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);
      // tổng tiền trước thanh toán
      checkout_order.totalPrice += checkoutPrice;
      const feeShip =
        (await generateFeeShip({
          num: checkProductServer.length,
          codeDistrictShop:
            checkProductServer[0].shop.shop_address.codeDistrict,
          codeWardUser: user_address.codeWard,
          codeDistrictUser: user_address.codeDistrict,
        })) || 20000;
      const itemCheckout = {
        shop: {
          id: checkProductServer[0].shop._id,
          name: checkProductServer[0].shop.shop_name,
        },
        itemProducts: checkProductServer.map((item) => {
          delete item["shop"];
          return {
            ...item,
            checkStock: item.quantity <= item.countStock,
            productTotal: item.quantity * item.price,
          };
        }),
        priceRaw: checkoutPrice, // tiền trước khi giảm giá
        priceApplyDiscount: checkoutPrice, // tiền sau khi apply Discount
        priceDiscount: 0,
        feeShip,
        totalCheckout: 0,
      };
      checkout_order.feeShip += itemCheckout.feeShip;
      if (shop_discounts.length > 0) {
        const { totalPrice = 0, discount = 0 } =
          await VoucherService.getDiscountAmount({
            code: shop_discounts[0].codeId,
            userId,
            shopId,
            products: checkProductServer,
          });

        // tổng cộng discount giảm giá
        checkout_order.totalDiscount += discount;

        // nếu tiền giảm giá lớn hơn 0
        if (discount > 0) {
          itemCheckout.priceApplyDiscount = totalPrice;
          itemCheckout.priceDiscount = discount;
        }
      }
      itemCheckout.totalCheckout =
        itemCheckout.feeShip + itemCheckout.priceApplyDiscount;
      shop_order_ids_new.push(itemCheckout);
    }
    checkout_order.totalCheckout =
      checkout_order.totalPrice +
      checkout_order.feeShip -
      checkout_order.totalDiscount;
    return {
      shop_order_ids_new,
      checkout_order,
    };
  };
  static orderByOrder = async ({
    cartId,
    userId,
    shop_order_ids,
    user_address,
    user_payment = { type: "cod" },
  }) => {
    const listDiscounts = shop_order_ids.flatMap(
      (order) => order.shop_discounts
    );

    const { shop_order_ids_new } = await CheckoutService.checkoutReview({
      cartId,
      userId,
      shop_order_ids,
      user_address,
    });
    const orders = await createOrders(
      shop_order_ids_new,
      listDiscounts,
      user_payment,
      user_address,
      cartId,
      userId
    );
    if (orders) {
      const notifications = await Promise.all(
        orders.reduce((result, order) => {
          return result.concat(
            ...[
              pushNotiToSystem({
                type: STATUS_NOTIFICATION.ORDER_SUCCESSFULLY,
                senderId: order.order_shop,
                receivedId: order.order_user,
                options: {
                  orderId: order._id,
                },
              }),
              pushNotiToSystem({
                type: STATUS_NOTIFICATION.ORDER_SUCCESSFULLY,
                senderId: null,
                receivedId: order.order_shop,
                options: {
                  orderId: order._id,
                },
              }),
            ]
          );
        }, [])
      );
      notifications.map((notify) => {
        if (notify.noti_receivedId + "" === userId) {
          _io.to(notify.noti_receivedId + "").emit("new-notify", {
            content: notify.noti_content,
            idOrder: notify.noti_options.orderId,
            type: "user",
          });
        } else {
          _io.to(notify.noti_receivedId + "").emit("new-notify", {
            content: notify.noti_content,
            idOrder: notify.noti_options.orderId,
            type: "shop",
          });
        }
      });
    }

    return 1;
  };
  /**
   * 1. Query Orders [User]
   */
  static async getOrdersByUser(userId, { status }) {
    const query = { order_user: userId };
    if (status) query.order_status = status;
    return await orderModel
      .find(query)
      .populate("order_shop", "shop_name _id shop_avatar")
      .populate("order_products.product", "product_name product_thumb _id")
      .select(
        "order_checkout order_isDelivered order_products order_shop order_status _id updatedAt createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .lean();
  }

  /**
   * 2. Query using Id [User]
   */
  // static async getOneOrderByUser(userId, orderId) {
  //   const order = await orderModel
  //     .findOne({
  //       _id: orderId,
  //       order_user: userId,
  //     })
  //     .populate("order_shop", "shop_name _id shop_avatar")
  //     .populate("order_products.product", "product_name product_thumb _id")
  //     .select(
  //       "order_checkout order_isDelivered order_isPaid order_products order_shop order_status _id updatedAt createdAt order_payment order_shipping"
  //     )
  //     .lean();
  //   if (!order) throw new NotFoundRequestError("Không tìm thấy order");
  //   return order;
  // }

  // 3. Cancel order [User]
  static async cancelOrderByUser(userId, orderId) {
    const foundCart = await findCartByUserId(userId);
    if (!foundCart) throw new NotFoundRequestError("Cart does not exists");
    const query = {
        _id: orderId,
        order_user: userId,
        order_status: STATUS_ORDER.PENDING,
      },
      bodyUpdate = { order_status: STATUS_ORDER.CANCELLED };
    const updateOrder = await findOneAndUpdate(query, bodyUpdate);

    if (updateOrder) {
      const { order_products } = updateOrder;
      const operations = order_products.map(({ product, quantity }) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(product) },
          update: {
            $inc: {
              product_quantity: quantity,
              product_quantity_sold: -quantity,
            },
          },
        },
      }));

      Promise.all([
        ...order_products.map(({ product, quantity }) =>
          cancelReservationInventory({
            inven_productId: product,
            quantity,
            cartId: foundCart._id,
          })
        ),
        productModel.bulkWrite(operations),
      ]);

      const notification = await pushNotiToSystem({
        type: STATUS_NOTIFICATION.ORDER_CANCELLED,
        senderId: null,
        receivedId: updateOrder.order_shop,
        options: {
          orderId: updateOrder._id + "",
        },
      });
      _io.to(notification.noti_receivedId + "").emit("new-notify", {
        content: notification.noti_content,
        idOrder: notification.noti_options.orderId,
        type: "shop",
      });
      return 1;
    } else {
      throw new BadRequestError("Không thể hủy");
    }
  }

  // GET ORDER BY SHOp
  static async getOrdersByShop(
    shopId,
    {
      status,
      page = 1,
      limit = 10,
      select = {
        order_products: 1,
        order_status: 1,
        order_paidAt: 1,
        order_isPaid: 1,
        order_deliveredAt: 1,
        order_checkout: 1,
        createdAt: 1,
        order_products: 1,
        _id: 1,
        updatedAt: 1,
        order_shipping: 1,
      },
      sortBy,
    }
  ) {
    const skip = (+page - 1) * limit;
    const query = { order_shop: new Types.ObjectId(shopId) };
    if (status) {
      query.order_status = status;
    }
    let sort = {
      createdAt: -1,
    };
    if (sortBy === "price-asc") {
      sort = {
        "order_checkout.totalCheckout": 1,
        createdAt: -1,
      };
    }
    if (sortBy === "price-desc") {
      sort = {
        "order_checkout.totalCheckout": -1,
        createdAt: -1,
      };
    }
    if (sortBy === "oldest") {
      sort = {
        createdAt: 1,
      };
    }

    const [orderFilter, orders] = await Promise.all([
      orderModel
        .find(query)
        .populate("order_user", "fullName _id avatar")
        .populate("order_products.product", "product_name product_thumb _id")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(select)
        .lean(),
      orderModel.find(query).select(select).lean(),
    ]);
    const total_pages = Math.ceil(orders.length / limit);
    return {
      orders: orderFilter,
      pagination: {
        total_pages,
        page,
        limit,
      },
    };
  }
  static async getOneOrder(shopId, orderId) {
    const order = await orderModel
      .findOne({
        _id: orderId,
        $or: [
          {
            order_shop: new Types.ObjectId(shopId),
          },
          {
            order_user: new Types.ObjectId(shopId),
          },
        ],
      })
      .populate("order_shop", "shop_name _id shop_avatar")
      .populate("order_products.product", "product_name product_thumb _id")
      .select(
        "order_checkout order_isDelivered order_isPaid order_products order_shop order_status _id updatedAt createdAt order_payment order_shipping"
      )
      .lean();
    if (!order) throw new NotFoundRequestError("Không tìm thấy order");
    return order;
  }

  // Update Order Status [Shop, Admin]
  static async confirmOrderByShop(shopId, orderId) {
    const query = {
        _id: orderId,
        order_shop: new Types.ObjectId(shopId),
        order_status: STATUS_ORDER.PENDING,
      },
      bodyUpdate = {
        order_status: STATUS_ORDER.CONFIRMED,
      };
    const updateOrder = await findOneAndUpdate(query, bodyUpdate);
    if (!updateOrder) {
      throw new BadRequestError("Confirm failed");
    }
    const notification = await pushNotiToSystem({
      type: STATUS_NOTIFICATION.ORDER_CONFIRMED,
      senderId: updateOrder.order_shop,
      receivedId: updateOrder.order_user,
      options: {
        orderId: updateOrder._id + "",
      },
    });
    _io.to(notification.noti_receivedId + "").emit("new-notify", {
      content: notification.noti_content,
      idOrder: notification.noti_options.orderId,
      type: "user",
    });

    return 1;
  }
  static async shipOrderByShop(shopId, orderId) {
    const query = {
        _id: orderId,
        order_shop: new Types.ObjectId(shopId),
        order_status: STATUS_ORDER.CONFIRMED,
      },
      bodyUpdate = { order_status: STATUS_ORDER.SHIPPED };
    const updateOrder = await findOneAndUpdate(query, bodyUpdate);
    if (!updateOrder) {
      throw new BadRequestError("Ship failed");
    }
    const notification = await pushNotiToSystem({
      type: STATUS_NOTIFICATION.ORDER_SHIPPED,
      senderId: updateOrder.order_shop,
      receivedId: updateOrder.order_user,
      options: {
        orderId: updateOrder._id + "",
      },
    });
    _io.to(notification.noti_receivedId + "").emit("new-notify", {
      content: notification.noti_content,
      idOrder: notification.noti_options.orderId,
      type: "user",
    });
    return 1;
  }
  static async cancelOrderByShop(shopId, { userId }, orderId) {
    const foundCart = await findCartByUserId(userId);
    if (!foundCart) throw new NotFoundRequestError("Cart does not exists");
    if (!userId) throw new BadRequestError("Không thể hủy");
    const query = {
        _id: orderId,
        order_user: userId,
        order_status: {
          $in: [STATUS_ORDER.PENDING, STATUS_ORDER.CONFIRMED],
        },
        order_shop: new Types.ObjectId(shopId),
      },
      bodyUpdate = { order_status: STATUS_ORDER.CANCELLED };
    const updateOrder = await findOneAndUpdate(query, bodyUpdate);

    if (updateOrder) {
      const { order_products } = updateOrder;
      const operations = order_products.map(({ product, quantity }) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(product) },
          update: {
            $inc: {
              product_quantity: quantity,
              product_quantity_sold: -quantity,
            },
          },
        },
      }));
      Promise.all([
        ...order_products.map(({ product, quantity }) =>
          cancelReservationInventory({
            inven_productId: product,
            quantity,
            cartId: foundCart._id,
          })
        ),
        productModel.bulkWrite(operations),
      ]);
      const notification = await pushNotiToSystem({
        type: STATUS_NOTIFICATION.ORDER_CANCELLED,
        senderId: updateOrder.order_shop,
        receivedId: updateOrder.order_user,
        options: {
          orderId: updateOrder._id + "",
        },
      });
      _io.to(notification.noti_receivedId + "").emit("new-notify", {
        content: notification.noti_content,
        idOrder: notification.noti_options.orderId,
        type: "user",
      });

      return 1;
    } else {
      throw new BadRequestError("Không thể hủy");
    }
  }
  static async deliveredOrderByShop(shopId, orderId) {
    const query = {
        _id: orderId,
        order_shop: new Types.ObjectId(shopId),
        order_status: STATUS_ORDER.SHIPPED,
      },
      bodyUpdate = {
        order_status: STATUS_ORDER.DELIVERED,
        order_isDelivered: true,
        order_isPaid: true,
        order_paidAt: new Date(),
        order_deliveredAt: new Date(),
      };
    const updateOrder = await findOneAndUpdate(query, bodyUpdate);
    if (!updateOrder) {
      throw new BadRequestError("Delivered failed");
    }
    const notification = await pushNotiToSystem({
      type: STATUS_NOTIFICATION.ORDER_DELIVERED,
      senderId: updateOrder.order_shop,
      receivedId: updateOrder.order_user,
      options: {
        orderId: updateOrder._id + "",
      },
    });
    _io.to(notification.noti_receivedId + "").emit("new-notify", {
      content: notification.noti_content,
      idOrder: notification.noti_options.orderId,
      type: "user",
    });

    return 1;
  }

  static async createOrderPaymentVnpay(
    req,
    {
      cartId,
      userId,
      shop_order_ids,
      user_address,
      user_payment = { type: "vnpay" },
      bankCode = "VNBANK",
      language = "vn",
    }
  ) {
    const listDiscounts = shop_order_ids.flatMap(
      (order) => order.shop_discounts
    );

    const { shop_order_ids_new } = await CheckoutService.checkoutReview({
      cartId,
      userId,
      shop_order_ids,
      user_address,
    });
    const orders = await createOrders(
      shop_order_ids_new,
      listDiscounts,
      user_payment,
      user_address,
      cartId,
      userId
    );
    if (!orders) throw BadRequestError("Bad Request");
    const amount = orders.reduce(
      (result, order) => result + order.order_checkout.totalCheckout,
      0
    );
    const orderIds = orders.map((order) => order._id);
    let idOrderVnpay = moment(new Date()).format("DDHHmmss");

    paymentModel.create({
      payment_vnpay: idOrderVnpay + "",
      payment_orderIds: orderIds,
    });

    process.env.TZ = "Asia/Ho_Chi_Minh";

    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    let tmnCode = CONFIG_VNPAY.vnp_TmnCode;
    let secretKey = CONFIG_VNPAY.vnp_HashSecret;
    let vnpUrl = CONFIG_VNPAY.vnp_Url;
    let returnUrl = CONFIG_VNPAY.vnp_ReturnUrl;

    let locale = language;
    if (locale === null || locale === "") {
      locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = idOrderVnpay;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + idOrderVnpay;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
      vnp_Params["vnp_BankCode"] = bankCode;
    }
    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    return vnpUrl;
  }
  static async vnPayReturn(req, res) {
    let vnp_Params = req.query;

    let secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    let tmnCode = CONFIG_VNPAY.vnp_TmnCode;
    let secretKey = CONFIG_VNPAY.vnp_HashSecret;

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
      const orderVnpay = req.query.vnp_OrderInfo.split("GD:")[1];
      console.log("orderVnpay", orderVnpay);
      const payment = await paymentModel.findOneAndUpdate(
        {
          payment_vnpay: orderVnpay + "",
          payment_success: false,
        },
        {
          payment_success: true,
        },
        {
          new: true,
        }
      );
      if (payment) {
        const orderIds = payment.payment_orderIds.map((id) =>
          convertToObjectIdMongo(id)
        );
        const orders = await Promise.all(
          orderIds.map((id) =>
            orderModel.findByIdAndUpdate(id, {
              order_isPaid: true,
              order_paidAt: new Date(),
            })
          )
        );
        if (orders) {
          console.log("orders", orders);
          const notifications = await Promise.all(
            orders.map((order) => {
              return pushNotiToSystem({
                type: STATUS_NOTIFICATION.ORDER_SUCCESSFULLY,
                senderId: null,
                receivedId: order.order_shop,
                options: {
                  orderId: order._id,
                },
              });
            })
          );
          console.log("notifications", notifications);

          notifications.map((notify) => {
            _io.to(notify.noti_receivedId + "").emit("new-notify", {
              content: notify.noti_content,
              idOrder: notify.noti_options.orderId,
              type: "shop",
            });
          });
        }
      }
      return 1;
      // res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
    } else {
      return 0;

      // res.render("success", { code: "97" });
    }
  }
}
// router.get("/vnpay_return", function (req, res, next) {

// });
const CONFIG_VNPAY = {
  vnp_TmnCode: "IO0XAFZF",
  vnp_HashSecret: "IIBWCXGBKYYAEANVCTDBKFJPICTCOADH",
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  vnp_ReturnUrl: "http://localhost:3000/checkout/payment",
};
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
module.exports = CheckoutService;
