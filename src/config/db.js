const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI; // Lấy URI từ biến môi trường
    await mongoose.connect(mongoURI);
    console.log("MongoDB Atlas connected");
  } catch (err) {
    console.error(err);
    process.exit(1); // Dừng ứng dụng nếu kết nối không thành công
  }
};

module.exports = connectDB;
