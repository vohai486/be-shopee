const express = require("express");
const { authentication, isAdmin } = require("../../middlewares/auth");
const voucherController = require("../../controllers/voucher.controller");

const router = express.Router();

// authentication //
router.use(authentication);
router.get("/", voucherController.getVoucherForUser);
router.get("/shop", voucherController.getVoucherForShop);
router.get("/:id", voucherController.getVoucherDetail);
router.patch("/:id", voucherController.updateVoucher);
router.delete("/:id", voucherController.deleteVoucher);

router.post("/amount", voucherController.getDiscountAmount);
router.post("/apply", voucherController.applyVoucher);

router.post("/", voucherController.createVoucher);

module.exports = router;
