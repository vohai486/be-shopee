const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Payment";
const COLLECTION_NAME = "Payments";

const paymentSchema = new Schema(
  {
    payment_vnpay: String,
    payment_orderIds: { type: [Schema.Types.ObjectId] },
    payment_success: { type: Boolean, default: false },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, paymentSchema);
