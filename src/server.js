const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("../src/routes/authRoutes");
const bodyParser = require("body-parser");
const authMiddleware = require("../src/middlewares/authMiddleware");

dotenv.config();
connectDB();

const app = express();
app.use(bodyParser.json()); // Phân tích body request
app.use(bodyParser.urlencoded({ extended: true })); // Phân tích body request với urlencoded

// Áp dụng middleware xác thực JWT cho tất cả các route trừ một số route nhất định
app.use((req, res, next) => {
  // Các route không cần bảo vệ
  const openRoutes = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/verify-otp",
    "/api/auth/resend-otp",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ];
  if (openRoutes.includes(req.path)) {
    return next();
  }
  // Áp dụng middleware xác thực JWT cho các route còn lại
  authMiddleware(req, res, next);
});

app.use("/api/auth", authRoutes); // Đăng ký các route auth

// Middleware
app.use(express.json());

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
