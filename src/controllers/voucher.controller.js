const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const VoucherService = require("../services/voucher.service");
const asyncHandler = require("../utils/asyncHandler");

class VoucherController {
  createVoucher = asyncHandler(async (req, res) => {
    new CREATED({
      message: "Regiserted OK",
      metadata: await VoucherService.createVoucher(req.user.userId, req.body),
    }).send(res);
  });
  getVoucherForUser = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await VoucherService.getVoucherForUser({
        ...req.query,
        userId: req.user.userId,
      }),
    }).send(res);
  });
  getVoucherForShop = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await VoucherService.getVoucherForShop(
        req.user.userId,
        req.query
      ),
    }).send(res);
  });
  getDiscountAmount = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await VoucherService.getDiscountAmount({
        userId: req.user.userId,
        ...req.body,
      }),
    }).send(res);
  });
  applyVoucher = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await VoucherService.applyVoucher({
        userId: req.user.userId,
        ...req.body,
      }),
    }).send(res);
  });
  getVoucherDetail = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await VoucherService.getVoucherDetail({
        userId: req.user.userId,
        id: req.params.id,
      }),
    }).send(res);
  });
  updateVoucher = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await VoucherService.updateVoucher({
        userId: req.user.userId,
        id: req.params.id,
        body: req.body,
      }),
    }).send(res);
  });
  deleteVoucher = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await VoucherService.deleteVoucher({
        userId: req.user.userId,
        id: req.params.id,
      }),
    }).send(res);
  });
}

module.exports = new VoucherController();
