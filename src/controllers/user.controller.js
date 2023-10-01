const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const UserService = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");

class UserController {
  registerSeller = asyncHandler(async (req, res) => {
    new CREATED({
      message: "Regiserted OK",
      metadata: await UserService.registerSeller(req.user, req.body),
    }).send(res);
  });
  getProfile = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.getProfile({ _id: req.user.userId }),
    }).send(res);
  });
  updateMe = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.updateMe({
        _id: req.user.userId,
        ...req.body,
      }),
    }).send(res);
  });
  uploadAvatar = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.uploadAvatar(req),
    }).send(res);
  });
  addAddress = asyncHandler(async (req, res) => {
    new CREATED({
      message: "Success",
      metadata: await UserService.addAddress(req.user.userId, req.body),
    }).send(res);
  });
  getAddress = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.getAddress(req.user.userId),
    }).send(res);
  });
  setAsDefault = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.setAsDefault(req.user.userId, req.params.id),
    }).send(res);
  });
  deleteAddress = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.deleteAddress(req.user.userId, req.params.id),
    }).send(res);
  });
  updateAddress = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.updateAddress({
        userId: req.user.userId,
        addressId: req.params.id,
        body: req.body,
      }),
    }).send(res);
  });
  followShop = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.followShop(req.user.userId, req.body),
    }).send(res);
  });
  unFollowShop = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.unFollowShop(req.user.userId, req.body),
    }).send(res);
  });
  checkAdmin = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.checkAdmin(req.isAdmin, req.user.userId),
    }).send(res);
  });
  getAllUser = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.getAllUser(req.query),
    }).send(res);
  });
  activeUser = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.activeUser(req.params.id),
    }).send(res);
  });
  inactiveUser = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await UserService.inactiveUser(req.params.id),
    }).send(res);
  });
}

module.exports = new UserController();
