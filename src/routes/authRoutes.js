const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyOTP,
  resendOTP,
} = require("../controllers/authController");

// Đăng ký người dùng
router.post("/register", registerUser);

// Xác thực OTP
router.post("/verify-otp", verifyOTP);

// Gửi lại OTP
router.post("/resend-otp", resendOTP);

module.exports = router;
