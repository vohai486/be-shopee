const express = require("express");
const { authentication, isAdmin } = require("../../middlewares/auth");
const categoryController = require("../../controllers/category.controller");
const checkoutController = require("../../controllers/checkout.controller");

const router = express.Router();

// authentication //
router.use(authentication);

// SHOP
router.get("/shop/get-all", checkoutController.getOrdersByShop);
router.patch("/:id", checkoutController.updateOrderStatusbyShop);
router.post("/shop/confirm/:id", checkoutController.confirmOrderByShop);
router.post("/shop/shipped/:id", checkoutController.shipOrderByShop);
router.post("/shop/delivered/:id", checkoutController.deliveredOrderByShop);
router.post("/shop/cancelled/:id", checkoutController.cancelOrderByShop);

// USER
router.get("/", checkoutController.getOrdersByUser);
router.post("/cancelled/:id", checkoutController.cancelOrderByUser);

router.post("/review", checkoutController.checkoutReview);
router.post("/", checkoutController.orderByOrder);

router.post("/create_payment_url", checkoutController.createOrderPaymentVnpay);
router.get("/vnpay_return", checkoutController.vnPayReturn);

router.get("/:id", checkoutController.getOneOrder);

module.exports = router;
