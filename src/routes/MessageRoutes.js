const express = require("express");
const router = express.Router();
const MessageController = require("../controllers/MessageController");

// Route to send a message
// http://localhost:5000/api/message/send
router.post("/send", MessageController.sendMessage);

// Route để lấy tất cả các tin nhắn của một cuộc hội thoại
// http://localhost:5000/api/message/getByConversation/:conversationId
router.get(
  "/getByConversation/:conversationId",
  MessageController.getMessagesByConversationId
);

module.exports = router;
