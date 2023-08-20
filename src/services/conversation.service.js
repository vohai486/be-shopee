const { USER } = require("../constants/role.user");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const {
  memberModel,
  conversationModel,
} = require("../models/conversation.model");
const messageModel = require("../models/message.model");
const {
  findConversationByMember,
  createConversation,
  updateLastViewOfConversation,
} = require("../models/repositories/conversation.repo");
const { convertToObjectIdMongo } = require("../utils");

class ConversationService {
  static async getList({ userId }) {
    // return await conversationModel
    //   .find({
    //     conversation_members: {
    //       $in: convertToObjectIdMongo(userId),
    //     },
    //   })
    //   .sort({
    //     updatedAt: -1,
    //   })
    //   .select({
    //     _id: 1,
    //     conversation_lastMessageId: 1,
    //     conversation_pin: 1,
    //     conversation_members: 1,
    //   })
    //   .populate({
    //     path: "conversation_members",
    //     match: { _id: { $ne: userId } },
    //     select: "avatar _id fullName",
    //   })
    //   .populate("conversation_lastMessageId", "message_type message_content")
    //   .lean();

    // const result = await memberModel.aggregate([
    //   {
    //     $match: {
    //       member_userId: convertToObjectIdMongo(userId),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "Conversations", // Thay đổi thành tên collection của Conversation
    //       localField: "member_conversationId",
    //       foreignField: "_id",
    //       as: "conversationInfo",
    //     },
    //   },
    //   {
    //     $unwind: "$conversationInfo",
    //   },
    //   {
    //     $lookup: {
    //       from: "Users",
    //       let: {
    //         conversationMembers: "$conversationInfo.conversation_members",
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $in: ["$_id", "$$conversationMembers"] },
    //                 { $ne: ["$_id", convertToObjectIdMongo(userId)] },
    //               ],
    //             },
    //           },
    //         },
    //         { $project: { avatar: 1, fullName: 1, _id: 1 } },
    //       ],
    //       as: "membersInfo",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "Messages",
    //       let: {
    //         lastMessageId: "$conversationInfo.conversation_lastMessageId",
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: { $eq: ["$_id", "$$lastMessageId"] },
    //           },
    //         },
    //         {
    //           $project: {
    //             message_content: 1,
    //             message_type: 1,
    //           },
    //         },
    //       ],
    //       as: "lastMessageInfo",
    //     },
    //   },
    //   {
    //     $project: {
    //       conversationInfo: 1,
    //       lastMessageInfo: 1,
    //       membersInfo: 1,
    //     },
    //   },
    // ]);
    const result = await conversationModel.aggregate([
      {
        $match: {
          conversation_members: {
            $in: [convertToObjectIdMongo(userId)],
          },
        },
      },
      {
        $project: {
          _id: 1,
          conversation_lastMessageId: 1,
        },
      },
      {
        $lookup: {
          from: "Members",
          let: { conversationId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$member_conversationId", "$$conversationId"],
                  // $and: [
                  //   { $ne: ["$member_userId", convertToObjectIdMongo(userId)] },
                  // ],
                },
              },
            },
            {
              $lookup: {
                from: "Users", // Thay đổi thành tên collection của User
                let: { userId: "$member_userId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", "$$userId"],
                      },
                    },
                  },
                  {
                    $project: { avatar: 1, fullName: 1, _id: 1 },
                  },
                ],
                as: "memberInfo",
              },
            },
            {
              $unwind: "$memberInfo",
            },
          ],
          as: "members",
        },
      },

      {
        $lookup: {
          from: "Messages",
          let: {
            lastMessageId: "$conversation_lastMessageId",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$lastMessageId"] },
              },
            },
            {
              $project: {
                message_content: 1,
                message_type: 1,
                createdAt: 1,
              },
            },
          ],
          as: "lastMessageInfo",
        },
      },
      {
        $unwind: "$lastMessageInfo",
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $project: {
          members: 1,
          _id: 1,
          lastMessageInfo: 1,
        },
      },
    ]);
    return result.map((item) => {
      const currentUser = item.members.find(
        (user) => user.member_userId + "" === userId + ""
      );
      const otherUser = item.members.find(
        (user) => user.member_userId + "" !== userId + ""
      );

      return {
        _id: item._id,
        user: otherUser.memberInfo,
        message: item.lastMessageInfo,
        isSeen:
          new Date(item.lastMessageInfo.createdAt) <=
          new Date(currentUser?.member_lastView),
      };
    });
  }
}

module.exports = ConversationService;
