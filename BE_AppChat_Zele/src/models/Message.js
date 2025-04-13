const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Can be user or group
  message_type: {
    type: String,
    enum: ["text", "image", "video", "file", "voice"],
    required: true,
  },
  content: { type: String },
  file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent",
  },
  message_meta: {
    is_edited: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    deleted_by_sender: { type: Boolean, default: false },
    deleted_by_receiver: { type: Boolean, default: false },
    is_encrypted: { type: Boolean, default: true },
    self_destruct_timer: { type: Number }, // In seconds
  },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reactions: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reaction_type: { type: String, enum: ["like", "love", "laugh", "sad"] },
    },
  ],
  replies: [
    {
      reply_to: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
      content: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Message", MessageSchema);
