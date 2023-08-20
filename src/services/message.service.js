const { USER } = require("../constants/role.user");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const { memberModel } = require("../models/conversation.model");
const messageModel = require("../models/message.model");
const {
  findConversationByMember,
  createConversation,
  updateLastViewOfConversation,
  checkUserInConversation,
  getLastViewOfConversation,
} = require("../models/repositories/conversation.repo");
const { convertToObjectIdMongo } = require("../utils");

class MessageService {
  static async addText(senderId, { content, receiverId }) {
    if (!senderId || !receiverId) throw new BadRequestError("bad request");
    const arrayMember = [
      convertToObjectIdMongo(senderId),
      convertToObjectIdMongo(receiverId),
    ];
    let conversation = null;
    const foundConversation = await findConversationByMember(arrayMember);
    if (!foundConversation) {
      conversation = await createConversation(arrayMember);
      await _io.to(receiverId + "").emit("join-group", conversation._id);
      await _io.to(senderId + "").emit("join-group", conversation._id);
    } else {
      conversation = foundConversation;
    }
    const message = await messageModel.create({
      message_conversationId: conversation._id,
      message_content: content,
      message_type: "text",
      message_userId: senderId,
    });
    if (message) {
      conversation.conversation_lastMessageId = message._id;
      _io.to(conversation._id + "").emit("new-message", conversation._id);
      await Promise.all([
        conversation.save(),
        updateLastViewOfConversation({
          conversationId: conversation._id,
          userId: senderId,
        }),
      ]);
    }

    return 1;
  }
  static async getListMessageByConversationId({ userId, conversationId }) {
    const [foundConversation, lastView] = await Promise.all([
      checkUserInConversation(
        convertToObjectIdMongo(userId),
        convertToObjectIdMongo(conversationId)
      ),
      getLastViewOfConversation({
        conversationId: convertToObjectIdMongo(conversationId),
        userId: convertToObjectIdMongo(userId),
      }),
    ]);

    if (!foundConversation || !lastView)
      throw new BadRequestError("Request Error");

    const messages = await messageModel
      .find({
        message_conversationId: convertToObjectIdMongo(conversationId),
      })
      .sort({ createdAt: -1 });

    return {
      messages,
      isSeen: new Date(messages[0].createdAt) <= new Date(lastView),
      lastView: lastView,
    };
  }
}

module.exports = MessageService;
