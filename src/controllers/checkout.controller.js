const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const CheckoutService = require("../services/checkout.service");
const asyncHandler = require("../utils/asyncHandler");

class CheckController {
  checkoutReview = asyncHandler(async (req, res, next) => {
    new OK({
      message: "Review successfully",
      metadata: await CheckoutService.checkoutReview({
        userId: req.user.userId,
        ...req.body,
      }),
    }).send(res);
  });
  orderByOrder = asyncHandler(async (req, res, next) => {
    new OK({
      message: "order successfully",
      metadata: await CheckoutService.orderByOrder({
        userId: req.user.userId,
        ...req.body,
      }),
    }).send(res);
  });
  getOrdersByUser = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.getOrdersByUser(
        req.user.userId,
        req.query
      ),
    }).send(res);
  });
  getOneOrderByUser = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.getOneOrderByUser(
        req.user.userId,
        req.params.id
      ),
    }).send(res);
  });
  cancelOrderByUser = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.cancelOrderByUser(
        req.user.userId,
        req.params.id
      ),
    }).send(res);
  });
  updateOrderStatusbyShop = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.updateOrderStatusbyShop({
        userId: req.user.userId,
        orderId: req.params.id,
      }),
    }).send(res);
  });
  getOrdersByShop = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.getOrdersByShop(
        req.user.userId,
        req.query
      ),
    }).send(res);
  });
  confirmOrderByShop = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.confirmOrderByShop(
        req.user.userId,
        req.params.id
      ),
    }).send(res);
  });
  shipOrderByShop = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.shipOrderByShop(
        req.user.userId,
        req.params.id
      ),
    }).send(res);
  });
  deliveredOrderByShop = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.deliveredOrderByShop(
        req.user.userId,
        req.params.id
      ),
    }).send(res);
  });
  cancelOrderByShop = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.cancelOrderByShop(
        req.user.userId,
        req.body,
        req.params.id
      ),
    }).send(res);
  });
  createOrderPaymentVnpay = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.createOrderPaymentVnpay(req, {
        userId: req.user.userId,
        ...req.body,
      }),
    }).send(res);
  });
  vnPayReturn = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await CheckoutService.vnPayReturn(req, res),
    }).send(res);
  });
}

module.exports = new CheckController();
