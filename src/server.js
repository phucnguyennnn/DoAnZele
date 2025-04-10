const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("../src/routes/authRoutes");
const bodyParser = require("body-parser");
const authMiddleware = require("../src/middlewares/authMiddleware");
const userRoutes = require("../src/routes/UserRoutes"); // Import user routes
const cookieParser = require("cookie-parser");
const messageRoutes = require("../src/routes/MessageRoutes"); // Import message routes
const conversationRoutes = require("./routes/ConversationRoutes"); // Import conversation routes

dotenv.config();
connectDB();

const app = express();
app.use(bodyParser.json()); // Phân tích body request
app.use(bodyParser.urlencoded({ extended: true })); // Phân tích body request với urlencoded
app.use(cookieParser());

// Middleware để xử lý CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Cho phép tất cả các nguồn gốc
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  ); // Các header cho phép
  res.header("Access-Control-Allow-Credentials", "true"); // Cho phép cookie
  next(); // Tiếp tục đến middleware tiếp theo
});

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

app.use("/api/conversation", conversationRoutes); // Register conversation routes
app.use("/api/auth", authRoutes); // Đăng ký các route auth
app.use("/api/user", userRoutes); // Đăng ký các route user
app.use("/api/message", messageRoutes); // Register message routes

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
