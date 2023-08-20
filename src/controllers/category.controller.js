const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const categoryModel = require("../models/category.model");
const asyncHandler = require("../utils/asyncHandler");

class CategoryController {
  createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;
    new CREATED({
      message: "Verify successfully",
      metadata: await categoryModel.create({ category_name: name }),
    }).send(res);
  });
  getAllCategory = asyncHandler(async (req, res) => {
    new OK({
      message: "OK",
      metadata: await categoryModel
        .find({})
        .select({ _id: 1, category_name: 1 }),
    }).send(res);
  });
}

module.exports = new CategoryController();
