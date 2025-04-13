const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");

exports.getConversationsByUserId = async (userId) => {
  // Kiểm tra ObjectId hợp lệ
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  // Tìm tất cả các đoạn hội thoại mà người dùng tham gia
  const conversations = await Conversation.find({
    "participants.user_id": userId,
  }).populate("last_message"); // Populate last_message để lấy thông tin chi tiết

  return conversations;
};
