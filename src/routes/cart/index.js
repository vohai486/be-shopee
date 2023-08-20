const express = require("express");
const cartController = require("../../controllers/cart.controller");
const { authentication } = require("../../middlewares/auth");

const router = express.Router();

router.use(authentication);

router.post("", cartController.addToCart);
router.delete("", cartController.deleteCartItems);
router.post("/update", cartController.update);
router.get("", cartController.listToCart);

module.exports = router;
