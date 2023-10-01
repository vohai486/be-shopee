const { Types } = require("mongoose");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const inventoryModel = require("../models/inventory.model");
const orderModel = require("../models/order.model");
const importModel = require("../models/import.model");

const { STATUS_ORDER } = require("../constants/status");
const { insertImport } = require("../models/repositories/import.repo");
const productModel = require("../models/product.model");
const { updateProduct } = require("../models/repositories/product.repo");
const { convertToVietnamTime } = require("../utils");

class StatisticService {
  static async getTodoList(shopId) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const [orders, inventories] = await Promise.all([
      orderModel.aggregate([
        {
          $match: {
            order_shop: new Types.ObjectId(shopId),
            createdAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $group: {
            _id: "$order_status",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
          },
        },
      ]),
      inventoryModel
        .find({
          inven_shopId: shopId,
          inven_stock: 0,
        })
        .lean(),
    ]);
    orders.push({
      status: "out-of-stock",
      count: inventories.length || 0,
    });
    return orders;
  }
  static async getStatsOrderByHour(shopId, date, queryStatus) {
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );

    const result = await orderModel.aggregate([
      {
        $match: {
          order_shop: new Types.ObjectId(shopId),
          createdAt: { $gte: startOfDay, $lt: endOfDay },
          ...queryStatus,
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          numberOfOrders: { $sum: 1 },
          totalAmount: { $sum: "$order_checkout.totalCheckout" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    const orderStatsByHour = Array.from({ length: 24 }, (_, index) => {
      const matchingHour = result.find(
        (item) => convertToVietnamTime(item._id) === index
      );
      return {
        key: index,
        numberOfOrders: matchingHour ? matchingHour.numberOfOrders : 0,
        totalAmount: matchingHour ? matchingHour.totalAmount : 0,
      };
    });
    return orderStatsByHour;
  }
  static async getStatsOrderByday(shopId, startDay, endDay, queryStatus) {
    const startOfDays = new Date(
      startDay.getFullYear(),
      startDay.getMonth(),
      startDay.getDate()
    );
    const endOfToday = new Date(
      endDay.getFullYear(),
      endDay.getMonth(),
      endDay.getDate() + 1
    );
    const days = Math.floor(
      Math.abs(endOfToday - startOfDays) / (24 * 60 * 60 * 1000)
    );
    const result = await orderModel.aggregate([
      {
        $match: {
          order_shop: new Types.ObjectId(shopId),
          createdAt: { $gte: startOfDays, $lt: endOfToday },
          ...queryStatus,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          numberOfOrders: { $sum: 1 }, // Tính số lượng đơn hàng cho mỗi giờ
          totalAmount: { $sum: "$order_checkout.totalCheckout" },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
          "_id.day": -1,
        },
      },
      {
        $limit: days,
      },
    ]);
    const orderStatsByDays = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startOfDays);
      date.setDate(startOfDays.getDate() + i);
      const matchingDay = result.find(
        (item) =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1 &&
          item._id.day === date.getDate()
      );
      orderStatsByDays.push({
        key: `${date.getDate()}/${date.getMonth() + 1}`,
        numberOfOrders: matchingDay ? matchingDay.numberOfOrders : 0,
        totalAmount: matchingDay ? matchingDay.totalAmount : 0,
      });
    }
    return orderStatsByDays;
  }
  static async getStatsOrderByMonth(shopId, year, queryStatus) {
    const result = await orderModel.aggregate([
      {
        $match: {
          order_shop: new Types.ObjectId(shopId),
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${Number(year) + 1}-01-01`),
          },
          ...queryStatus,
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          numberOfOrders: { $sum: 1 },
          totalAmount: { $sum: "$order_checkout.totalCheckout" },
        },
      },
    ]);
    const numMonth =
      new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;
    const orderStatsByMonth = [];
    for (let i = 1; i <= numMonth; i++) {
      const matchingDay = result.find((item) => item._id === i);
      orderStatsByMonth.push({
        key: `Tháng ${i}`,
        numberOfOrders: matchingDay ? matchingDay.numberOfOrders : 0,
        totalAmount: matchingDay ? matchingDay.totalAmount : 0,
      });
    }
    return orderStatsByMonth;
  }
  static async getStatsOrder(
    shopId,
    { type, startDate, selectedDate, endDate, year, status }
  ) {
    if (
      ![
        "current",
        "yesterday",
        "7days",
        "day",
        "30days",
        "week",
        "year",
        "month",
      ].includes(type)
    ) {
      throw new BadRequestError("Bad request");
    }
    const queryStatus = {};
    if (status === "booked") {
      queryStatus.order_status = { $ne: STATUS_ORDER.CANCELLED };
    }
    if (status === "confirmed") {
      queryStatus.order_status = {
        $nin: [STATUS_ORDER.CANCELLED, STATUS_ORDER.PENDING],
      };
    }
    if (status === "cancelled") {
      queryStatus.order_status = STATUS_ORDER.CANCELLED;
    }
    if (type === "current") {
      return await StatisticService.getStatsOrderByHour(
        shopId,
        new Date(),
        queryStatus
      );
    }
    if (type === "yesterday") {
      const currentDate = new Date();
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);
      return await StatisticService.getStatsOrderByHour(
        shopId,
        new Date(yesterday),
        queryStatus
      );
    }
    if (type === "7days") {
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 7);
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() - 1);
      return await StatisticService.getStatsOrderByday(
        shopId,
        new Date(startDate),
        new Date(endDate),
        queryStatus
      );
    }
    if (type === "day") {
      return await StatisticService.getStatsOrderByHour(
        shopId,
        new Date(selectedDate),
        queryStatus
      );
    }
    if (type === "30days") {
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 30);
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() - 1);
      return await StatisticService.getStatsOrderByday(
        shopId,
        new Date(startDate),
        new Date(endDate),
        queryStatus
      );
    }
    if (type === "year") {
      return await StatisticService.getStatsOrderByMonth(
        shopId,
        year,
        queryStatus
      );
    }
    if (type === "week") {
      return await StatisticService.getStatsOrderByday(
        shopId,
        new Date(startDate),
        new Date(endDate),
        queryStatus
      );
    }
    if (type === "month") {
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const nextMonth = new Date(year, month, 1);
      const lastDayOfMonth =
        new Date(nextMonth - 1) > new Date()
          ? new Date()
          : new Date(nextMonth - 1);

      return await StatisticService.getStatsOrderByday(
        shopId,
        new Date(year, month - 1, 1),
        new Date(lastDayOfMonth),
        queryStatus
      );
    }
  }
}

module.exports = StatisticService;
