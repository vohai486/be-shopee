const { model, Schema } = require("mongoose");
const { STATUS_ORDER } = require("../constants/status");

const DOCUMENT_NAME = "Order";
const COLLECTION_NAME = "Orders";

const orderSchema = new Schema(
  {
    order_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order_checkout: { type: Object, default: {} },
    order_note: String,
    /**
     * order_checkout :{
     *  totalPrice,
     *  totalApplyDiscount
     *  feeShip
     * }
     */
    order_shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    order_shipping: { type: Object, default: {} },
    order_payment: { type: Object, default: {} }, // kiểu thanh toán
    order_products: {
      type: [
        {
          price: { type: Number, required: true },
          product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          quantity: { type: Number, required: true },
        },
      ],
      required: true,
    }, //shop_order_ids_new
    order_trackingNumber: { type: String, default: "#00001" },
    order_status: {
      type: String,
      enum: [
        STATUS_ORDER.PENDING,
        STATUS_ORDER.CONFIRMED,
        STATUS_ORDER.SHIPPED,
        STATUS_ORDER.CANCELLED,
        STATUS_ORDER.DELIVERED,
      ],
      default: STATUS_ORDER.PENDING,
    },
    order_isPaid: { type: Boolean, defautl: false },
    order_paidAt: Date,
    order_isDelivered: {
      type: Boolean,
      default: false,
    },
    order_deliveredAt: Date,
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, orderSchema);
