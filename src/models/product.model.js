const { model, Schema, Types } = require("mongoose");
const slugify = require("slugify");
const DOCUMENT_NAME = "Product";
const COLLECTION_NAME = "Products";

const productSchema = new Schema(
  {
    product_name: { type: String, required: true },
    product_thumb: { type: String, required: true },
    product_images: { type: [String], default: [] },
    product_description: { type: String, required: true },
    product_originalPrice: { type: Number, required: true },
    product_price: { type: Number, default: 0 },
    product_discount: { type: Number, required: true },
    product_quantity: { type: Number, required: true },
    product_quantity_sold: { type: Number, default: 0 },
    product_category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    product_shop: { type: Schema.Types.ObjectId, ref: "Shop" },
    product_specifications: { type: Schema.Types.Mixed, required: true },
    // more
    product_brand: { type: String, default: "" },
    product_ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating must be above 0"],
      max: [5, "Rating must be above 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    product_reviewCount: { type: Number, default: 0 },
    product_size: { type: Object, default: {} },
    product_variations: {
      type: Array,
      default: [],
    },

    verify: { type: Boolean, default: false, index: true, select: false }, // verify by admin
    isDraft: { type: Boolean, default: true, index: true, select: false }, // Draft
    isPublished: { type: Boolean, default: false, index: true, select: false }, // show
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);
// create index for search
productSchema.index({ product_name: "text", product_description: "text" });

// Document middleware : runs before .save() and create()
productSchema.pre("save", function (next) {
  this.product_price =
    (this.product_originalPrice * (100 - this.product_discount)) / 100;
  next();
});

module.exports = model(DOCUMENT_NAME, productSchema);
