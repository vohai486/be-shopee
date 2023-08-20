const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const MessageService = require("../services/message.service");
const asyncHandler = require("../utils/asyncHandler");

class MessageController {
  addText = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await MessageService.addText(req.user.userId, req.body),
    }).send(res);
  });
  getListMessageByConversationId = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await MessageService.getListMessageByConversationId({
        userId: req.user.userId,
        ...req.query,
      }),
    }).send(res);
  });
}

module.exports = new MessageController();
