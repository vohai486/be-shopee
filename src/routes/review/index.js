const express = require("express");
const { authentication, isAdmin } = require("../../middlewares/auth");
const reviewController = require("../../controllers/review.controller");
const {
  uploadImages,
  uploadFiles,
  resizeImages,
} = require("../../utils/upload");

const router = express.Router();

// authentication //
router.get("", reviewController.getReviewsByUser);
router.use(authentication);
router
  .route("")
  .post(
    uploadImages,
    resizeImages,
    uploadFiles("review_product"),
    reviewController.createReview
  );

module.exports = router;
