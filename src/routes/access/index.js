const express = require("express");
const accessController = require("../../controllers/access.controller");
const { authentication } = require("../../middlewares/auth");
// const { asyncHandler } = require("../../middlewares/handleError");
// const { authenticationV2 } = require("../../auth/authUtils");

const router = express.Router();

// signUp
router.post("/signup", accessController.signUp);

// login
router.post("/login", accessController.login);

// authentication //
router.use(authentication);

router.post("/logout", accessController.logout);
router.post("/refreshtoken", accessController.handleRefreshToken);

module.exports = router;
