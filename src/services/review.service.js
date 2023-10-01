const { BadRequestError } = require("../core/error.response");
const productModel = require("../models/product.model");
const reviewModel = require("../models/review.model");
const { convertToObjectIdMongo } = require("../utils");

class ReviewService {
  static async createReview(
    { images = [], content = "", productId, rating = 2, review_parent = null },
    userId
  ) {
    const doc = await reviewModel.create({
      review_content: content,
      review_images: images,
      review_user: userId,
      review_product: productId,
      review_rating: rating,
      review_parent,
    });
    if (!doc) throw new BadRequestError("Đánh giá thất bại");
    return 1;
  }
  static async getReviewsByUser({ productId }) {
    let [reviewParents, reviewChild] = await Promise.all([
      reviewModel
        .find({ review_product: productId, review_parent: null })
        .select({
          review_content: 1,
          review_images: 1,
          createdAt: 1,
          review_user: 1,
          review_rating: 1,
          review_product: 1,
          _id: 1,
        })
        .populate("review_user", "avatar fullName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      reviewModel
        .find({
          review_product: productId,
          review_parent: { $ne: null },
        })
        .select({
          review_content: 1,
          review_parent: 1,
          _id: 1,
        })
        .lean(),
    ]);
    reviewParents = reviewParents.map((item) => ({
      ...item,
      review_child: [],
    }));
    reviewChild.forEach((review) => {
      const index = reviewParents.findIndex(
        (ele) => ele._id.toString() === review.review_parent.toString()
      );
      if (index > -1) {
        reviewParents[index].review_child.push(review);
      }
    });
    console.log({ reviewParents });
    return reviewParents;

    // return await reviewModel
    //   .find({ review_product: productId })
    //   .select({
    //     review_content: 1,
    //     review_images: 1,
    //     createdAt: 1,
    //     review_user: 1,
    //     review_rating: 1,
    //     _id: 1,
    //   })
    //   .populate("review_parent")
    //   .populate("review_user", "avatar fullName")
    //   .sort({ createdAt: -1 })
    //   .limit(5)
    //   .lean();
  }
  static async getReviewsByShop(idUser) {
    const productList = await productModel
      .find({
        product_shop: convertToObjectIdMongo(idUser),
      })
      .select({ _id: 1 })
      .lean();

    const productListId = productList.map((item) =>
      convertToObjectIdMongo(item._id)
    );

    let [reviewParents, reviewChild] = await Promise.all([
      reviewModel
        .find({
          review_product: {
            $in: productListId,
          },
          review_parent: null,
        })
        .select({
          review_content: 1,
          review_images: 1,
          createdAt: 1,
          review_user: 1,
          review_rating: 1,
          review_product: 1,
          _id: 1,
        })
        .populate("review_user", "avatar fullName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      reviewModel
        .find({
          review_product: {
            $in: productListId,
          },
          review_parent: { $ne: null },
        })
        .select({
          review_content: 1,
          review_parent: 1,
          _id: 1,
        })
        .lean(),
    ]);
    reviewParents = reviewParents.map((item) => ({
      ...item,
      review_child: [],
    }));
    reviewChild.forEach((review) => {
      const index = reviewParents.findIndex(
        (ele) => ele._id.toString() === review.review_parent.toString()
      );
      if (index > -1) {
        reviewParents[index].review_child.push(review);
      }
    });
    return reviewParents;
  }
}

module.exports = ReviewService;
