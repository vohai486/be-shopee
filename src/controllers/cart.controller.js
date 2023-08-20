const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const CartService = require("../services/cart.service");
const asyncHandler = require("../utils/asyncHandler");

class CartController {
  addToCart = asyncHandler(async (req, res, next) => {
    new CREATED({
      message: "Add cart successfully",
      metadata: await CartService.addToCart(req.user.userId, req.body),
    }).send(res);
  });
  deleteCartItems = asyncHandler(async (req, res, next) => {
    new OK({
      message: "OK",
      metadata: await CartService.deleteItemCart(req.user.userId, req.body),
    }).send(res);
  });
  update = asyncHandler(async (req, res, next) => {
    new OK({
      message: "OK",
      metadata: await CartService.updateUserCartQuantity(
        req.user.userId,
        req.body
      ),
    }).send(res);
  });
  listToCart = asyncHandler(async (req, res, next) => {
    new OK({
      message: "OK",
      metadata: await CartService.getListUserCart(req.user.userId),
    }).send(res);
  });
}

module.exports = new CartController();
