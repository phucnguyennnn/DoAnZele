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

    // Lắng nghe sự kiện thu hồi tin nhắn
    socket.on("revokeMessage", async ({ messageId, userId }) => {
      try {
        const result =
          await require("../services/MessageService").revokeMessage(
            messageId,
            userId
          );

        if (!result) {
          socket.emit("error", "You are not allowed to revoke this message");
          return;
        }

        // Gửi thông báo real-time đến người nhận và người gửi
        const receiverId = result.receiver_id.toString();
        const senderId = result.sender_id.toString();

        // Thông báo cho người nhận
        if (onlineUsers.has(receiverId)) {
          io.to(onlineUsers.get(receiverId)).emit("messageRevoked", {
            messageId,
            is_revoked: true,
          });
        }

        // Thông báo cho người gửi
        if (onlineUsers.has(senderId)) {
          io.to(onlineUsers.get(senderId)).emit("messageRevoked", {
            messageId,
            is_revoked: true,
          });
        }
      } catch (error) {
        console.error("Error revoking message:", error.message);
        socket.emit("error", "Error revoking message");
      }
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

// Hàm gửi thông báo về đoạn hội thoại mới cho nhiều người dùng
const notifyUsersAboutConversation = (userIds, event, data) => {
  userIds.forEach((userId) => {
    const socketId = onlineUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data); // Gửi sự kiện đến socketId cụ thể
    }
  });
};

module.exports = {
  initializeSocket,
  sendMessageToUser,
  notifyUsersAboutConversation, // Xuất hàm mới
  onlineUsers,
  io,
};
