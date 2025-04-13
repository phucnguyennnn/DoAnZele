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
  })
    .populate("last_message")
    .populate({
      path: "participants.user_id",
      select: "name primary_avatar", // Chỉ lấy các trường cần thiết
    });

  // Chuyển đổi participants thành định dạng mong muốn
  const formattedConversations = conversations.map((conversation) => {
    const formattedParticipants = conversation.participants.map(
      (participant) => ({
        user_id: participant.user_id._id,
        name: participant.user_id.name,
        primary_avatar: participant.user_id.primary_avatar,
        _id: participant._id,
      })
    );

    return {
      ...conversation.toObject(),
      participants: formattedParticipants,
    };
  });

  return formattedConversations;
};
