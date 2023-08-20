const { conversationModel, memberModel } = require("../conversation.model");

exports.findConversationByMember = async (arrayUserId) => {
  return await conversationModel.findOne({
    conversation_members: { $all: arrayUserId },
  });
};
exports.checkUserInConversation = async (userId, conversationId) => {
  return await conversationModel
    .findOne({
      conversation_members: { $in: userId },
      _id: conversationId,
    })
    .lean();
};
exports.createConversation = async (arrayUserId) => {
  const conversation = await conversationModel.create({
    conversation_members: arrayUserId,
  });
  if (conversation) {
    memberModel.insertMany(
      arrayUserId.map((id) => ({
        member_conversationId: conversation._id,
        member_userId: id,
        member_lastView: new Date(),
      }))
    );
  }
  return conversation;
};
exports.updateLastViewOfConversation = async ({ conversationId, userId }) => {
  return await memberModel.findOneAndUpdate(
    {
      member_conversationId: conversationId,
      member_userId: userId,
    },
    {
      member_lastView: new Date(),
    }
  );
};
exports.getLastViewOfConversation = async ({ conversationId, userId }) => {
  return (
    await memberModel.findOne({
      member_conversationId: conversationId,
      member_userId: { $ne: userId },
    })
  )?.member_lastView;
};
