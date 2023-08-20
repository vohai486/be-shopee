const keytokenModel = require("../models/keytoken.model");
const { Types } = require("mongoose");
const reviewModel = require("../models/review.model");

class ReviewService {
  static async createReview(
    { images = [], content = "", productId, type, rating },
    userId
  ) {
    return (await reviewModel.create({
      review_content: content,
      review_images: images,
      review_user: userId,
      review_product: productId,
      review_rating: rating,
    }))
      ? 1
      : 0;
  }
  static async getReviewsByUser({ productId }) {
    console.log(productId);
    return await reviewModel
      .find({ review_product: productId })
      .select({
        review_content: 1,
        review_images: 1,
        createdAt: 1,
        review_user: 1,
        review_rating: 1,
        _id: 1,
      })
      .populate("review_user", "avatar fullName")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
  }
}

module.exports = ReviewService;
