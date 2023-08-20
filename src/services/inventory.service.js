const { Types } = require("mongoose");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const inventoryModel = require("../models/inventory.model");
const orderModel = require("../models/order.model");
const importModel = require("../models/import.model");

const { STATUS_ORDER } = require("../constants/status");
const { insertImport } = require("../models/repositories/import.repo");
const productModel = require("../models/product.model");
const { updateProduct } = require("../models/repositories/product.repo");

class InventoryService {
  static async manageInventory(shopId, { status, page = 1, limit = 10 }) {
    const query = { inven_shopId: shopId };
    const skip = (+page - 1) * limit;
    if (status === "out-of-stock") {
      query.inven_stock = 0;
    }
    if (status === "low-in-stock") {
      query.inven_stock = {
        $lt: 10,
      };
    }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [inventoriesFilters, inventories, products] = await Promise.all([
      inventoryModel
        .find(query)
        .select("inven_productId _id inven_stock")
        .skip(skip)
        .limit(limit)
        .populate("inven_productId", "product_name product_thumb _id")
        .lean(),
      inventoryModel
        .find(query)
        .select("inven_productId _id inven_stock")
        .populate("inven_productId", "product_name product_thumb _id")
        .lean(),
      orderModel.aggregate([
        {
          $match: {
            order_shop: new Types.ObjectId(shopId),
            $or: [
              {
                createdAt: { $gte: sevenDaysAgo },
              },
              {
                createdAt: { $gte: thirtyDaysAgo },
              },
            ],
            order_status: { $ne: STATUS_ORDER.CANCELLED },
          },
        },
        {
          $unwind: "$order_products",
        },
        {
          $match: {
            "order_products.product": { $exists: true },
          },
        },
        {
          $facet: {
            "7_days": [
              { $match: { createdAt: { $gte: sevenDaysAgo } } },
              {
                $group: {
                  _id: "$order_products.product",
                  totalSold: { $sum: "$order_products.quantity" },
                },
              },
              { $project: { _id: 1, period: "7_days", totalSold: 1 } },
            ],
            "30_days": [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              {
                $group: {
                  _id: "$order_products.product",
                  totalSold: { $sum: "$order_products.quantity" },
                },
              },
              { $project: { _id: 1, period: "30_days", totalSold: 1 } },
            ],
          },
        },
        {
          $project: {
            sales: {
              $concatArrays: ["$7_days", "$30_days"], // Gộp kết quả từ 7_days và 30_days thành một mảng duy nhất
            },
          },
        },
        {
          $unwind: "$sales",
        },
        {
          $replaceRoot: { newRoot: "$sales" }, // Đưa kết quả lên cấp cao hơn để trả về mảng kết quả duy nhất
        },
      ]),
    ]);

    const result =
      inventoriesFilters &&
      inventoriesFilters.map((inven) => {
        const idProduct = inven.inven_productId._id.toString();
        const findProductsByOrder = products.filter(
          (product) => product._id.toString() === idProduct
        );
        if (findProductsByOrder.length > 0) {
          findProductsByOrder.forEach((item) => {
            if (item.period === "7_days") {
              inven.sell_7_days = item.totalSold;
            }
            if (item.period === "30_days") {
              inven.sell_30_days = item.totalSold;
            }
          });
        } else {
          inven.sell_7_days = 0;
          inven.sell_30_days = 0;
        }
        return inven;
      });
    const total_pages = Math.ceil(inventories.length / limit);
    return {
      inventories: result,
      pagination: {
        total_pages,
        page,
        limit,
      },
    };
  }
  static async importProduct(shopId, { productId, quantity, price }) {
    console.log(productId, quantity, price);
    await Promise.all([
      insertImport({
        import_productId: productId,
        import_shopId: shopId,
        import_quantity: quantity,
        import_purchase: price,
      }),
      inventoryModel.findOneAndUpdate(
        {
          inven_productId: productId,
          inven_shopId: shopId,
        },
        {
          $inc: {
            inven_stock: +quantity,
          },
        }
      ),
      updateProduct(
        { _id: productId, product_shop: shopId },
        {
          $inc: {
            product_quantity: +quantity,
          },
        }
      ),
    ]);
    return 1;
  }
}

module.exports = InventoryService;
