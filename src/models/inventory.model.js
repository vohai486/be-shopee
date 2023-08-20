const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Inventory";
const COLLECTION_NAME = "Inventories";

const inventorySchema = new Schema(
  {
    inven_productId: { type: Schema.Types.ObjectId, ref: "Product" },
    inven_location: {
      type: String,
      default: "unknown",
    },
    inven_stock: { type: Number, required: true },
    inven_shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
    inven_reservations: { type: Array, default: [] },
    // Đặt trước sản phẩm, ngăn ngừa lỗi hàng tồn kho và đảm bảo khách hàng nhận được sản phẩm mà họ đã đặt hàng, Khi thanh toán thì xóa đi
    /**
     * cartId,
     * stock,
     * createdOn
     */
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, inventorySchema);
