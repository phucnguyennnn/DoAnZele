const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  full_name: { type: String, required: true },
  phone_number: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  verificationCode: { type: String, default: "" }, // Mã xác thực
  isVerified: { type: Boolean, default: false }, // Trạng thái xác thực
  status: { type: String, default: "offline" },
  avatar_url: { type: String, default: "" },
  last_active: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
