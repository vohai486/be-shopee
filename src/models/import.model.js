const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Import";
const COLLECTION_NAME = "Imports";

const importSchema = new Schema(
  {
    import_productId: { type: Schema.Types.ObjectId, ref: "Product" },
    import_shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
    import_quantity: { type: Number, required: true },
    import_supplier: { type: String, default: "" },
    import_purchase: { type: Number, required: true },
    import_location: { type: String, default: "Unknown" },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, importSchema);
