const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const InventoryService = require("../services/inventory.service");
const StatisticService = require("../services/statistic.service");
const asyncHandler = require("../utils/asyncHandler");

class StatisticsController {
  getTodoList = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await StatisticService.getTodoList(req.user.userId),
    }).send(res);
  });
  getStatsOrder = asyncHandler(async (req, res) => {
    new OK({
      message: "successfully",
      metadata: await StatisticService.getStatsOrder(
        req.user.userId,
        req.query
      ),
    }).send(res);
  });
}

module.exports = new StatisticsController();
