const express = require("express");
const { authentication, isAdmin } = require("../../middlewares/auth");
const statisticsController = require("../../controllers/statistics.controller");

const router = express.Router();

// authentication //
router.use(authentication);
router.get("/", statisticsController.getTodoList);
router.get("/order", statisticsController.getStatsOrder);

router.use(isAdmin);

module.exports = router;
