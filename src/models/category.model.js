const { model, Schema, Types } = require("mongoose");
const { STATUS } = require("../constants/status");

const DOCUMENT_NAME = "Category";
const COLLECTION_NAME = "Categories";

const shopSchema = new Schema(
  {
    category_name: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

module.exports = model(DOCUMENT_NAME, shopSchema);
