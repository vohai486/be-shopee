const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const AccessService = require("../services/access.service");
const asyncHandler = require("../utils/asyncHandler");

class AccessController {
  signUp = asyncHandler(async (req, res, next) => {
    new CREATED({
      message: "Regiserted OK",
      metadata: await AccessService.signUp(req.body),
    }).send(res);
  });
  login = asyncHandler(async (req, res, next) => {
    new OK({
      message: "Login successfully",
      metadata: await AccessService.login(req.body),
    }).send(res);
  });
  logout = asyncHandler(async (req, res, next) => {
    new SuccessResponse({
      metadata: await AccessService.logout(req.keyStore),
      message: "Logout Success",
    }).send(res);
  });
  handleRefreshToken = asyncHandler(async (req, res, next) => {
    new SuccessResponse({
      metadata: await AccessService.handleRefreshToken({
        user: req.user,
        keyStore: req.keyStore,
        refreshToken: req.refreshToken,
      }),
      message: "Get token success",
    }).send(res);
  });
}

module.exports = new AccessController();
