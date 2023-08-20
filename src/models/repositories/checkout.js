const { BadRequestError } = require("../../core/error.response");
const CartService = require("../../services/cart.service");
const { convertToObjectIdMongo } = require("../../utils");
const orderModel = require("../order.model");
const productModel = require("../product.model");
const voucherModel = require("../voucher.model");
const {
  reservationInventory,
  cancelReservationInventory,
} = require("./inventory.repo");

exports.createOrders = async (
  shop_order_ids_new,
  listDiscounts,
  user_payment,
  user_address,
  cartId,
  userId
) => {
  const products = shop_order_ids_new.flatMap((order) => order.itemProducts);
  const productIdAndQuantity = products.map((product) => ({
    productId: product.productId,
    quantity: product.quantity,
  }));
  const acquireProduct = await Promise.all(
    productIdAndQuantity.map(({ productId, quantity }) =>
      reservationInventory({
        inven_productId: productId,
        quantity,
        cartId,
      })
    )
  );
  if (acquireProduct.filter((x) => x).length === 0)
    throw new BadRequestError(
      "Một số sản phẩm đã được cập nhập, vui lòng quay lại giỏ hàng"
    );
  if (
    acquireProduct.filter((x) => x).length !== products.length &&
    acquireProduct.filter((x) => x).length > 0
  ) {
    const productIdAndQuantity = products.map(({ product, quantity }, idx) => {
      if (acquireProduct[idx]) {
        return {
          productId: product,
          quantity: quantity,
        };
      }
      return null;
    });
    await Promise.all(
      productIdAndQuantity
        .filter((product) => product)
        .map(({ productId, quantity }) =>
          cancelReservationInventory({
            inven_productId: productId,
            quantity,
            cartId,
          })
        )
    );
    throw new BadRequestError(
      "Một số sản phẩm đã được cập nhập, vui lòng quay lại giỏ hàng"
    );
  }

  const orderDataArray = shop_order_ids_new.map((item) => ({
    order_user: convertToObjectIdMongo(userId),
    order_checkout: {
      totalPrice: item.priceRaw,
      feeShip: item.feeShip,
      totalDiscount: item.priceDiscount,
      totalCheckout: item.totalCheckout,
    },
    order_payment: user_payment,
    order_shipping: user_address,
    order_shop: convertToObjectIdMongo(item.shop.id),
    order_products: item.itemProducts.map((ele) => ({
      price: ele.price,
      product: convertToObjectIdMongo(ele.productId),
      quantity: ele.quantity,
    })),
  }));
  const listIdProduct = productIdAndQuantity.map((item) => item.productId);
  const operations = productIdAndQuantity.map(({ productId, quantity }) => ({
    updateOne: {
      filter: { _id: convertToObjectIdMongo(productId) },
      update: {
        $inc: {
          product_quantity: -quantity,
          product_quantity_sold: quantity,
        },
      },
    },
  }));

  const [orders, ...rest] = await Promise.all([
    orderModel.insertMany(orderDataArray),
    CartService.deleteItemCart(userId, {
      productIds: listIdProduct,
    }),
    ...listDiscounts.map((voucher) =>
      voucherModel.findOneAndUpdate(
        {
          _id: convertToObjectIdMongo(voucher.voucherId),
        },
        {
          $push: { voucher_user_used: userId },
        }
      )
    ),
    productModel.bulkWrite(operations),
  ]);
  return orders;
};
