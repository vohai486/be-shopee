"use strict"; // giảm rò rỉ bộ nhớ
const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Voucher";
const COLLECTION_NAME = "Vouchers";

const voucherSchema = new Schema(
  {
    voucher_name: { type: String, required: true },
    voucher_type: {
      type: String,
      default: "fixed_amount",
      enum: ["fixed_amount", "percentage"],
    }, // giảm theo số tiền, percentage : phần trắm
    voucher_value: { type: Number, required: true }, // 10.000, 10%
    voucher_code: { type: String, required: true }, // code
    voucher_start_date: { type: Date, required: true }, // ngày bắt đầu
    voucher_end_date: { type: Date, required: true }, // ngày kết thúc
    voucher_max_uses: { type: Number, required: true }, // số lượng tối đa discount được áp dụng
    voucher_user_count: { type: Number, default: 0 }, // số discount đã sử dụng
    voucher_user_used: { type: Array, default: [] }, // ai đã sử dụng
    voucher_user_applied: { type: Array, default: [] }, // ai đã apply
    voucher_max_uses_per_user: { type: Number, required: true }, // số lượng tối đa 1 người dùng sử dụng
    voucher_min_order_value: { type: Number, required: true }, // Giá trị đơn hàng tối thiểu
    voucher_shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
    voucher_is_active: {
      type: Boolean,
      default: true,
    },

    voucher_applies_to: {
      type: String,
      required: true,
      enum: ["all", "specific"],
    },
    voucher_product_ids: {
      type: Array,
      default: [],
    }, // Số sản phẩm được áp dụng
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, voucherSchema);
