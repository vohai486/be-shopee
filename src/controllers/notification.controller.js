const { SuccessResponse } = require("../core/success.response");
const {
  listNotiByUser,
  listNotiByShop,
  markReadNoti,
  markReadAllNoti,
} = require("../services/notification.service");
const asyncHandler = require("../utils/asyncHandler");

class NotificationController {
  listNotiByUser = asyncHandler(async (req, res, next) => {
    new SuccessResponse({
      message: "successfully",
      metadata: await listNotiByUser(req.user.userId),
    }).send(res);
  });
  listNotiByShop = asyncHandler(async (req, res, next) => {
    new SuccessResponse({
      message: "successfully",
      metadata: await listNotiByShop(req.user.userId),
    }).send(res);
  });
  markReadNoti = asyncHandler(async (req, res, next) => {
    new SuccessResponse({
      message: "successfully",
      metadata: await markReadNoti(req.user.userId, req.params.id),
    }).send(res);
  });
  markReadAllNoti = asyncHandler(async (req, res, next) => {
    new SuccessResponse({
      message: "successfully",
      metadata: await markReadAllNoti(req.user.userId),
    }).send(res);
  });
}
module.exports = new NotificationController();
