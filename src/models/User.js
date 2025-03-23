const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    unique: [true, "Số điện thoại đã được đăng ký!"],
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Kiểm tra phone có đúng 10 chữ số
      },
      message: (props) =>
        `Số điện thoại không hợp lệ! Số điện thoại phải đúng 10 chữ số!`,
    },
    required: [true, "Vui lòng nhập số điện thoại"],
  },
  email: {
    type: String,
    unique: [true, "Email đã được đăng ký!"],
    match: [/.+\@.+\..+/, "Vui lòng nhập email hợp lệ"], // Kiểm tra định dạng email
    required: [true, "Vui lòng nhập email"],
  },
  name: { type: String, required: [true, "Vui lòng nhập tên"] },
  dob: Date,
  password_hash: {
    type: String,
    required: [true, "Vui lòng nhập mật khẩu"],
  },
  otp: String,
  otp_expiry: Date,
  otp_sent_at: Date,
  otp_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
