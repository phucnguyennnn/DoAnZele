const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
} = require("../controllers/authController");

// Đăng ký người dùng
router.post("/register", registerUser);

// Đăng nhập người dùng
router.post("/login", loginUser);

// Xác thực OTP
router.post("/verify-otp", verifyOTP);

// Gửi lại OTP
router.post("/resend-otp", resendOTP);

// Route bảo vệ (ví dụ)
router.get("/profile", (req, res) => {
  res.send("This is a protected route");
});

module.exports = router;
