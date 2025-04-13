const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.sendMessage = async (senderId, receiverId, messageData) => {
  const { message_type, content, file_id, mentions, self_destruct_timer } =
    messageData;

  // Kiểm tra xem người gửi và người nhận có phải là người dùng hợp lệ hay không
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);
  if (!sender) {
    throw new Error("Người gửi không hợp lệ");
  }
  if (!receiver) {
    throw new Error("Người nhận không hợp lệ");
  }

  // Create a new message
  const message = new Message({
    sender_id: senderId,
    receiver_id: receiverId,
    message_type,
    content,
    file_id,
    mentions,
    "message_meta.self_destruct_timer": self_destruct_timer,
  });

  await message.save();

  // Update or create a conversation
  let conversation = await Conversation.findOne({
    "participants.user_id": { $all: [senderId, receiverId] }, // Đảm bảo cả 2 user_id đều tồn tại
    participants: { $size: 2 }, // Đảm bảo chỉ có 2 người tham gia
  });

  if (!conversation) {
    conversation = new Conversation({
      participants: [
        { user_id: senderId, name: sender.name, image: sender.image },
        { user_id: receiverId, name: receiver.name, image: receiver.image },
      ],
      type: "personal",
      last_message: message._id,
      messages: [
        {
          message_id: message._id,
          sender_id: senderId,
          content: content,
          timestamp: message.timestamp,
        },
      ],
    });
  } else {
    conversation.last_message = message._id;
    conversation.updated_at = Date.now();
    conversation.messages.push({
      message_id: message._id,
      sender_id: senderId,
      content: content,
      timestamp: message.timestamp,
    });
  }

  await conversation.save();

  return message;
};

exports.getMessagesByConversationId = async (conversationId) => {
  // Kiểm tra ObjectId hợp lệ
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error("Invalid conversation ID");
  }

  // Tìm cuộc hội thoại
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Lấy tất cả các tin nhắn thuộc về cuộc hội thoại
  const messages = await Message.find({
    _id: { $in: conversation.messages.map((msg) => msg.message_id) },
  })
    .populate("sender_id", "_id name email phone primary_avatar") // Populate thông tin người gửi
    .populate("receiver_id", "_id name email phone primary_avatar"); // Populate thông tin người nhận

  return messages;
};
