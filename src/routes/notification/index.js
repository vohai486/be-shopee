const express = require("express");
const notificationController = require("../../controllers/notification.controller");
const { authentication } = require("../../middlewares/auth");

const router = express.Router();
router.use(authentication);
router.get("", notificationController.listNotiByUser);
router.post("/mark-read/:id", notificationController.markReadNoti);
router.post("/mark-read-all", notificationController.markReadAllNoti);

router.get("", notificationController.listNotiByUser);

router.get("/shop", notificationController.listNotiByShop);

module.exports = router;
