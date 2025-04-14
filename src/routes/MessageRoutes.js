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

// Route để thu hồi tin nhắn
// http://localhost:5000/api/message/revoke/:messageId
router.put("/revoke/:messageId", MessageController.revokeMessage);

module.exports = router;
