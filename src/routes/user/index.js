const express = require("express");
const userController = require("../../controllers/user.controller");
const { authentication, isAdmin } = require("../../middlewares/auth");
const { uploadImage, resizeImage400 } = require("../../utils/upload");

const router = express.Router();

// authentication //
router.use(authentication);
router.get("/get-profile", userController.getProfile);
router.patch("/me/update", userController.updateMe);
router.post("/address/add", userController.addAddress);
router.get("/address/all", userController.getAddress);
router.post("/address/:id", userController.setAsDefault);
router.delete("/address/:id", userController.deleteAddress);
router.patch("/address/:id", userController.updateAddress);

router.post("/follow-shop", userController.followShop);
router.post("/unfollow-shop", userController.unFollowShop);

router
  .route("/upload-avatar")
  .post(uploadImage, resizeImage400, userController.uploadAvatar);
// router.post("/upload-avatar");

router.use(isAdmin);
router.post("/check-admin", userController.checkAdmin);

module.exports = router;
