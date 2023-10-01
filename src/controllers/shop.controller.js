const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const ShopService = require("../services/shop.service");
const asyncHandler = require("../utils/asyncHandler");

class ShopController {
  checkShop = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await ShopService.checkShop(req.user.userId),
    }).send(res);
  });
  getDetailShop = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await ShopService.getDetailShop(
        req.params.id,
        req.user.userId,
        req.query
      ),
    }).send(res);
  });
  getAllShop = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await ShopService.getAllShop(req.query),
    }).send(res);
  });
  registerSeller = asyncHandler(async (req, res) => {
    new CREATED({
      message: "CREATED",
      metadata: await ShopService.registerSeller(req.user, req.body),
    }).send(res);
  });
  activeShop = asyncHandler(async (req, res) => {
    new OK({
      message: "CREATED",
      metadata: await ShopService.activeShop(req.body),
    }).send(res);
  });
  inActiveShop = asyncHandler(async (req, res) => {
    new OK({
      message: "CREATED",
      metadata: await ShopService.inActiveShop(req.body),
    }).send(res);
  });
}

module.exports = new ShopController();
