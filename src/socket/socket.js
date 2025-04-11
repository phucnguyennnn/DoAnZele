const { Server } = require("socket.io");

let io;
const onlineUsers = new Map(); // Map để ánh xạ userId với socketId

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Cho phép tất cả các domain (có thể giới hạn domain cụ thể)
      // Tất cả các phương thức HTTP đều được phép
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Lắng nghe sự kiện đăng ký userId
    socket.on("registerUser", (userId) => {
      onlineUsers.set(userId, socket.id); // Lưu userId và socketId
      console.log(`User ${userId} is online with socket ID ${socket.id}`);
    });

    // Lắng nghe sự kiện ngắt kết nối
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId); // Xóa userId khi socket ngắt kết nối
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};

// Hàm gửi tin nhắn đến một user cụ thể
const sendMessageToUser = (userId, event, data) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data); // Gửi sự kiện đến socketId cụ thể
  }
};

module.exports = { initializeSocket, sendMessageToUser, onlineUsers, io };
