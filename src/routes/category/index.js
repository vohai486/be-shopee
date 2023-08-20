const express = require("express");
const { authentication, isAdmin } = require("../../middlewares/auth");
const categoryController = require("../../controllers/category.controller");

const router = express.Router();

router.get("/", categoryController.getAllCategory);

// authentication //
router.use(authentication);
router.use(isAdmin);

router.post("/", categoryController.createCategory);

module.exports = router;
