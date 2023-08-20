const { model, Schema, Types } = require("mongoose");
const { STATUS } = require("../constants/status");

const DOCUMENT_NAME = "Shop";
const COLLECTION_NAME = "Shops";

const shopSchema = new Schema(
  {
    shop_name: { type: String, required: true, trim: true },
    shop_address: {
      type: Object,
      default: {},
    },
    shop_avatar: { type: String, default: "" },
    shop_status: {
      type: String,
      enum: [STATUS.ACTIVE, STATUS.INACTIVE],
      default: STATUS.ACTIVE,
      select: false,
    },
    shop_role: {
      type: Array,
      default: [],
    },
    shop_followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    shop_ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating must be above 0"],
      max: [5, "Rating must be above 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    shop_reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

module.exports = model(DOCUMENT_NAME, shopSchema);
