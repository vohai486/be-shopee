const { CREATED, SuccessResponse, OK } = require("../core/success.response");
const ReviewService = require("../services/review.service");
const asyncHandler = require("../utils/asyncHandler");

class ReviewController {
  createReview = asyncHandler(async (req, res, next) => {
    new CREATED({
      message: "OK",
      metadata: await ReviewService.createReview(req.body, req.user.userId),
    }).send(res);
  });
  getReviewsByUser = asyncHandler(async (req, res, next) => {
    new OK({
      message: "OK",
      metadata: await ReviewService.getReviewsByUser(req.query),
    }).send(res);
  });
  getReviewsByShop = asyncHandler(async (req, res, next) => {
    new OK({
      message: "OK",
      metadata: await ReviewService.getReviewsByShop(req.user.userId),
    }).send(res);
  });
}

module.exports = new ReviewController();
