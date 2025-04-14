const express = require("express");
const router = express.Router();
const ConversationController = require("../controllers/ConversationController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route để lấy tất cả các đoạn hội thoại của người dùng
// http://localhost:5000/api/conversation/getAll
router.get(
  "/getAll",
  authMiddleware,
  ConversationController.getConversationsByUserId
);

module.exports = router;
