const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const CheckoutService = require("../services/checkout.service");
const ConversationService = require("../services/conversation.service");
const asyncHandler = require("../utils/asyncHandler");

class ConversationController {
  getList = asyncHandler(async (req, res, next) => {
    new OK({
      message: "Get successfully",
      metadata: await ConversationService.getList({
        userId: req.user.userId,
      }),
    }).send(res);
  });
}

module.exports = new ConversationController();
