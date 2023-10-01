const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const ProductService = require("../services/product.service");
const asyncHandler = require("../utils/asyncHandler");

class ProductController {
  createProduct = asyncHandler(async (req, res) => {
    new CREATED({
      message: "Create product successfully",
      metadata: await ProductService.createProduct(req, req.user.userId),
    }).send(res);
  });
  updateProduct = asyncHandler(async (req, res) => {
    new OK({
      message: "Update product successfully",
      metadata: await ProductService.updateProduct(req, req.user.userId),
    }).send(res);
  });
  verifyProduct = asyncHandler(async (req, res) => {
    new OK({
      message: "Verify successfully",
      metadata: await ProductService.verifyProduct(req.body),
    }).send(res);
  });
  unVerifyProduct = asyncHandler(async (req, res) => {
    new OK({
      message: "Un Verify successfully",
      metadata: await ProductService.unVerifyProduct(req.body),
    }).send(res);
  });
  publishProductByShop = asyncHandler(async (req, res) => {
    new OK({
      message: "Published successfully",
      metadata: await ProductService.publishProductByShop({
        product_shop: req.user.userId,
        body: req.body,
      }),
    }).send(res);
  });
  unPublishProductByShop = asyncHandler(async (req, res) => {
    new OK({
      message: "Unpublished successfully",
      metadata: await ProductService.unPublishProductByShop({
        product_shop: req.user.userId,
        body: req.body,
      }),
    }).send(res);
  });
  getAllProduct = asyncHandler(async (req, res) => {
    new OK({
      message: "get products successfully",
      metadata: await ProductService.getAllProduct(req.query),
    }).send(res);
  });
  findProduct = asyncHandler(async (req, res) => {
    new OK({
      message: "get product successfully",
      metadata: await ProductService.findProduct(req.params.id),
    }).send(res);
  });
  getListSearchProduct = asyncHandler(async (req, res) => {
    new OK({
      message: "get list search successfully",
      metadata: await ProductService.getListSearchProduct(req.params.keySearch),
    }).send(res);
  });
  getAllProductForShop = asyncHandler(async (req, res) => {
    new OK({
      message: "get list successfully",
      metadata: await ProductService.getAllProductForShop(
        req.user.userId,
        req.query
      ),
    }).send(res);
  });
  getAllProductForAdmin = asyncHandler(async (req, res) => {
    new OK({
      message: "get list successfully",
      metadata: await ProductService.getAllProductForAdmin(req.query),
    }).send(res);
  });
}

module.exports = new ProductController();
