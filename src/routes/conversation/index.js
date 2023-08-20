const express = require("express");
const { authentication } = require("../../middlewares/auth");
const messageController = require("../../controllers/message.controller");
const conversationController = require("../../controllers/conversation.controller");

const router = express.Router();

// authentication //
router.use(authentication);
router.get("", conversationController.getList);
module.exports = router;
