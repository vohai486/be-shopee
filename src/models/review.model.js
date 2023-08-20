const mongoose = require("mongoose");
const { updateProduct } = require("./repositories/product.repo");

const DOCUMENT_NAME = "Review";
const COLLECTION_NAME = "Reviews";
const reviewSchema = new mongoose.Schema(
  {
    review_content: {
      type: String,
      required: true,
    },
    review_rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    review_images: { type: Array, default: [] },
    review_product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

reviewSchema.index({ review_user: 1, review_product: 1 }, { unique: true });
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { review_product: productId },
    },
    {
      $group: {
        _id: "$review_product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$review_rating" },
      },
    },
  ]);
  if (stats.length > 0) {
    await updateProduct(
      { _id: productId },
      {
        product_ratingsAverage: stats[0].avgRating,
        product_reviewCount: stats[0].nRating,
      }
    );
  }
};
// chạy sau khi các middleware đã hoàn thành
reviewSchema.post("save", async function () {
  this.constructor.calcAverageRatings(this.review_product);
});

// khi update or delete

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.review_product);
});

module.exports = mongoose.model(DOCUMENT_NAME, reviewSchema);
