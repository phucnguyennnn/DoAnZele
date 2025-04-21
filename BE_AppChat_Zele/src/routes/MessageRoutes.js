const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // Middleware xử lý file upload
const MessageController = require("../controllers/MessageController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route to send a message
// http://localhost:5000/api/message/send
router.post("/send", authMiddleware, upload.single("file"), MessageController.sendMessage);

// Route để gửi tin nhắn vào nhóm
// http://localhost:5000/api/message/send-group
router.post(
  "/send-group", authMiddleware,
  upload.single("file"),
  MessageController.sendGroupMessage
);

// Route để lấy tất cả các tin nhắn của một cuộc hội thoại
// http://localhost:5000/api/message/getByConversation/:conversationId
router.get(
  "/getByConversation/:conversationId", authMiddleware,
  MessageController.getMessagesByConversationId
);

// http://localhost:5000/api/message/revoke/:messageId
router.put("/revoke/:messageId", authMiddleware, MessageController.revokeMessage);

module.exports = router;
