const express = require("express");
const { authentication } = require("../../middlewares/auth");
const messageController = require("../../controllers/message.controller");

const router = express.Router();

// authentication //
router.use(authentication);
router.post("/add-text", messageController.addText);
router.get("/", messageController.getListMessageByConversationId);

module.exports = router;
