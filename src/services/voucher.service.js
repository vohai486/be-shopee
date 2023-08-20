const { USER } = require("../constants/role.user");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const { findOneShop } = require("../models/repositories/shop.repo");
const voucherModel = require("../models/voucher.model");
const { omitObjectKey } = require("../utils");

class VoucherService {
  static async createVoucher(shopId, body) {
    const foundShop = await findOneShop(shopId);
    if (!foundShop) throw new NotFoundRequestError("Shop not found");
    const {
      voucher_code,
      voucher_end_date,
      voucher_name,
      voucher_value,
      voucher_min_order_value,
      voucher_start_date,
      voucher_max_uses,
      voucher_max_uses_per_user,
      product_ids = [],
      applies_to = "all",
      type = "fixed_amount",
    } = body;

    if (new Date(voucher_start_date) >= new Date(voucher_end_date)) {
      throw new BadRequestError("Start date must be before end_date!");
    }
    const foundVoucher = await voucherModel
      .findOne({
        voucher_code,
        voucher_shopId: shopId,
      })
      .lean();
    if (foundVoucher) {
      throw new BadRequestError("Voucher exists");
    }

    const newVoucher = await voucherModel.create({
      voucher_name,
      voucher_type: type,
      voucher_code,
      voucher_start_date,
      voucher_end_date,
      voucher_max_uses,
      voucher_max_uses_per_user,
      voucher_min_order_value,
      voucher_shopId: shopId,
      voucher_applies_to: applies_to,
      voucher_product_ids: product_ids,
      voucher_value,
    });
    return newVoucher ? 1 : 0;
  }
  static async updateVoucher({ userId, id, body }) {
    const voucher = await voucherModel.findOneAndUpdate(
      {
        _id: id,
        voucher_shopId: userId,
      },
      body
    );
    if (!voucher) throw new NotFoundRequestError("Update failed");
    return 1;
  }
  static async getVoucherDetail({ userId, id }) {
    return await voucherModel
      .findOne({
        _id: id,
        voucher_shopId: userId,
      })
      .select({
        voucher_code: 1,
        voucher_start_date: 1,
        voucher_end_date: 1,
        voucher_min_order_value: 1,
        voucher_name: 1,
        voucher_value: 1,
        voucher_max_uses: 1,
        voucher_max_uses_per_user: 1,
      })
      .lean();
  }
  static async getVoucherForShop(userId, { status, page = 1, limit = 10 }) {
    const query = { voucher_shopId: userId, voucher_is_active: true };
    if (status === "happenning") {
      query.voucher_start_date = { $lte: new Date() };
      query.voucher_end_date = { $gte: new Date() };
    }
    if (status === "upcoming") {
      query.voucher_start_date = { $gt: new Date() };
    }
    if (status === "finished") {
      query.voucher_end_date = { $lt: new Date() };
    }
    const skip = (+page - 1) * limit;
    const [voucherFiter, vouchers] = await Promise.all([
      voucherModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({
          createdAt: -1,
        })
        .select({
          voucher_name: 1,
          _id: 1,
          voucher_max_uses: 1,
          voucher_start_date: 1,
          voucher_value: 1,
          voucher_end_date: 1,
          voucher_value: 1,
          voucher_user_used: 1,
        })
        .lean(),
      voucherModel
        .find(query)
        .select({
          _id: 1,
        })
        .lean(),
    ]);
    const result = voucherFiter.map((item) => {
      const newItem = omitObjectKey(item, [
        "voucher_start_date",
        "voucher_end_date",
        "voucher_user_used",
      ]);
      newItem.status =
        new Date() < new Date(item.voucher_start_date)
          ? "upcoming"
          : new Date() > new Date(item.voucher_end_date)
          ? "finished"
          : "happenning";
      newItem.numUsed = item.voucher_user_used.length;
      newItem.codeRetentionTime = Math.floor(
        (new Date(item.voucher_end_date) - new Date(item.voucher_start_date)) /
          (1000 * 60 * 60 * 24)
      );
      return newItem;
    });
    const total_pages = Math.ceil(vouchers.length / limit);
    return {
      data: result,
      pagination: {
        total_pages,
        page,
        limit,
      },
    };
  }
  static async getVoucherForUser({ shopId, userId }) {
    const vouchers = await voucherModel
      .find({
        voucher_shopId: shopId,
        voucher_is_active: true,
        voucher_start_date: {
          $lte: new Date(),
        },
        voucher_end_date: {
          $gte: new Date(),
        },
      })
      .select({
        _id: 1,
        voucher_name: 1,
        voucher_end_date: 1,
        voucher_user_count: 1,
        voucher_max_uses: 1,
        voucher_min_order_value: 1,
        voucher_type: 1,
        voucher_value: 1,
        voucher_user_applied: 1,
        voucher_user_used: 1,
        voucher_max_uses_per_user: 1,
        voucher_code: 1,
      })
      .sort({
        voucher_value: -1,
      })
      .lean();

    const results = vouchers.map((voucher) => {
      voucher.is_apply = false;
      voucher.is_use = true;
      if (
        voucher.voucher_user_used.filter((id) => id === userId.toString())
          .length === voucher.voucher_max_uses_per_user
      ) {
        voucher.is_use = false;
      }
      if (voucher.voucher_user_applied.includes(userId.toString())) {
        voucher.is_apply = true;
      }
      delete voucher["voucher_user_applied"];
      delete voucher["voucher_max_uses_per_user"];
      delete voucher["voucher_user_used"];
      return voucher;
    });
    return results
      .filter((item) => item.is_use)
      .sort((a, b) => b.is_apply - a.is_apply);
  }
  static async deleteVoucher({ userId, id }) {
    const voucher = await voucherModel.findOneAndDelete({
      _id: id,
      voucher_shopId: userId,
    });
    if (!voucher) throw new NotFoundRequestError("Delete failed");
    return 1;
  }
  // apply voucher
  static async applyVoucher({ userId, voucherId }) {
    const newVoucher = await voucherModel.findOneAndUpdate(
      {
        _id: voucherId,
        voucher_user_applied: {
          $nin: userId,
        },
      },
      {
        $push: {
          voucher_user_applied: userId,
        },
        $inc: {
          voucher_user_count: 1,
        },
      },
      {
        new: true,
      }
    );
    return newVoucher?.modifiedCount ? 1 : 0;
  }

  static async getDiscountAmount({ code, userId, shopId, products }) {
    const foundVoucher = await voucherModel
      .findOne({
        voucher_code: code,
        voucher_shopId: shopId,
      })
      .lean();

    if (!foundVoucher) {
      throw new NotFoundRequestError(`Không tìm thấy voucher`);
    }
    const {
      voucher_is_active,
      voucher_user_count,
      voucher_max_uses,
      voucher_start_date,
      voucher_end_date,
      voucher_min_order_value,
      voucher_max_uses_per_user,
      voucher_user_used,
      voucher_type,
      voucher_value,
    } = foundVoucher;
    console.log(foundVoucher);
    if (
      !voucher_is_active ||
      voucher_user_count === voucher_max_uses ||
      new Date() < new Date(voucher_start_date) ||
      new Date() > new Date(voucher_end_date)
    )
      throw new BadRequestError(`Voucher expried`);

    let totalOrder = 0;
    totalOrder = products.reduce((acc, product) => {
      return acc + product.quantity * product.price;
    }, 0);

    if (voucher_min_order_value > 0 && totalOrder < voucher_min_order_value) {
      throw new BadRequestError(
        `Giá trị tối thiểu để áp dụng là ${voucher_min_order_value}`
      );
    }

    if (voucher_max_uses_per_user > 0) {
      const count = voucher_user_used.filter(
        (id) => id.toString() === userId.toString()
      ).length;
      if (count >= voucher_max_uses_per_user) {
        throw new BadRequestError(`Bạn đã hết lượt sử dụng voucher này`);
      }
    }

    const amount =
      voucher_type === "fixed_amount"
        ? voucher_value
        : totalOrder * (voucher_value / 100);

    return {
      totalOrder,
      discount: amount,
      totalPrice: totalOrder - amount,
    };
  }
}

module.exports = VoucherService;
