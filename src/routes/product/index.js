const express = require("express");
const { authentication, isAdmin } = require("../../middlewares/auth");
const productController = require("../../controllers/product.controller");
const {
  uploadImage,
  resizeImage750,
  uploadProduct,
} = require("../../utils/upload");

const router = express.Router();

router.get("", productController.getAllProduct);
router.get("/:id", productController.findProduct);
router.get("/search/:keySearch", productController.getListSearchProduct);

// authentication //
router.use(authentication);

router
  .route("")
  .post(uploadImage, resizeImage750, productController.createProduct);

router.post("/publish", productController.publishProductByShop);
router.post("/un-publish", productController.unPublishProductByShop);

router.get("/product-shop/all", productController.getAllProductForShop);

router.use(isAdmin);
router.post("/verify-products", productController.verifyProduct);
router.get("/product-admin/all", productController.getAllProductForAdmin);

module.exports = router;
