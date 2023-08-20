const express = require("express");
const { authentication, isAdmin, optional } = require("../../middlewares/auth");
const shopController = require("../../controllers/shop.controller");

const router = express.Router();

router.use(optional);

router.get("", shopController.getAllShop);
router.get("/:id", shopController.getDetailShop);

// authentication //
router.use(authentication);
router.post("/check-shop", shopController.checkShop);

router.post("/register-seller", shopController.registerSeller);

router.use(isAdmin);

module.exports = router;
