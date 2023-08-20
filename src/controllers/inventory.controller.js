const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const InventoryService = require("../services/inventory.service");
const asyncHandler = require("../utils/asyncHandler");

class InventoryController {
  manageInventory = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await InventoryService.manageInventory(
        req.user.userId,
        req.query
      ),
    }).send(res);
  });
  importProduct = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await InventoryService.importProduct(req.user.userId, req.body),
    }).send(res);
  });
}

module.exports = new InventoryController();
