const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Message";
const COLLECTION_NAME = "Messages";

const messageSchema = new Schema(
  {
    message_conversationId: {
      type: Types.ObjectId,
      required: true,
      ref: "Conversation",
    },
    message_content: { type: String, default: "", trim: true },
    message_isDeleted: { type: Boolean, required: false },
    message_reacts: { type: [{ userId: String, type: Number }], default: [] },
    message_reply: {
      type: Types.ObjectId,
      ref: "Message",
    },
    message_type: {
      type: String,
      required: true,
      enum: ["product", "order", "image", "text"],
    },
    message_userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, messageSchema);
