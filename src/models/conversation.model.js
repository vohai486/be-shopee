const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Conversation";
const COLLECTION_NAME = "Conversations";

const conversationSchema = new Schema(
  {
    conversation_lastMessageId: {
      type: Types.ObjectId,
      ref: "Message",
    },
    conversation_members: {
      type: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
      required: true,
    },
    conversation_pin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);
const memberSchema = new Schema(
  {
    member_conversationId: {
      type: Types.ObjectId,
      ref: "Conversation",
    },
    member_lastView: Date,
    member_userId: { type: Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    collection: "Members",
  }
);
module.exports = {
  conversationModel: model(DOCUMENT_NAME, conversationSchema),
  memberModel: model("Member", memberSchema),
};
