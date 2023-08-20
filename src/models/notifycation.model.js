const { model, Schema } = require("mongoose");
const { STATUS_NOTIFICATION } = require("../constants/status");

const DOCUMENT_NAME = "Notification";
const COLLECTION_NAME = "Notifications";

const notificationSchema = new Schema(
  {
    noti_type: {
      type: String,
      enum: [
        STATUS_NOTIFICATION.ORDER_CANCELLED,
        STATUS_NOTIFICATION.ORDER_CONFIRMED,
        STATUS_NOTIFICATION.ORDER_DELIVERED,
        STATUS_NOTIFICATION.ORDER_FAILED,
        STATUS_NOTIFICATION.ORDER_SHIPPED,
        STATUS_NOTIFICATION.ORDER_SUCCESSFULLY,
        STATUS_NOTIFICATION.SHOP_NEW_PRODUCT,
      ],
      required: true,
    },
    noti_senderId: { type: Schema.Types.ObjectId, ref: "User" },
    noti_receivedId: { type: Schema.Types.ObjectId, ref: "User" },
    noti_content: { type: String, required: true },
    noti_options: { type: Object, default: {} },
    noti_isRead: { type: Boolean, default: false },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, notificationSchema);
