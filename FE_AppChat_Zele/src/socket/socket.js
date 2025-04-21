import { io } from "socket.io-client";

// API URL có thể đổi thành biến môi trường sau này
const API_URL = "http://localhost:5000";
let socket;

// Get user data from localStorage
const getUser = () => {
    try {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    } catch (e) {
        console.error("Error parsing user data:", e);
        return null;
    }
};

// Khởi tạo socket - tương tự cách làm trong React Native
export const initializeSocket = () => {
    try {
        const token = localStorage.getItem('accessToken');
        const user = getUser();

        if (socket && socket.connected) {
            console.log('Socket đã được kết nối.');
            return socket;
        }

        socket = io(API_URL, {
            transports: ["websocket"],
            withCredentials: true,
            auth: {
                token,
                userId: user?._id
            },
            reconnection: true,
            timeout: 10000
        });

        socket.on('connect', () => {
            console.log('Socket connected with ID:', socket.id);

            // Đăng ký user với server khi kết nối thành công
            if (user && user._id) {
                socket.emit('registerUser', user._id);
                console.log('Đã đăng ký user với server:', user._id);
            }
        });

        // Thiết lập debug event listener
        socket.onAny((event, ...args) => {
            console.log(`[SOCKET] Đã nhận sự kiện "${event}":`, args);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        // Ghi log các sự kiện nhận được (để debug)
        socket.on('receiveMessage', (data) => {
            console.log('Socket received message:', data);
        });

        return socket;
    } catch (error) {
        console.error('Socket initialization error:', error);
        return null;
    }
};

// Đảm bảo socket được khởi tạo
if (!socket) {
    socket = initializeSocket();
}

// Gửi tin nhắn - tương tự React Native
export const emitMessage = (messageData) => {
    if (!socket) {
        socket = initializeSocket();
    }

    socket.emit('sendMessage', messageData);
    return messageData;
};

// Đăng ký nhận tin nhắn
export const subscribeToMessages = (callback) => {
    if (!socket) {
        socket = initializeSocket();
    }

    console.log('Đăng ký lắng nghe tin nhắn mới');

    // Xóa các listener cũ để tránh trùng lặp
    socket.off('receiveMessage');
    socket.off('newMessage');
    socket.off('updateMessage');

    // Đăng ký các sự kiện mới
    socket.on('receiveMessage', (message) => {
        console.log('Socket event receiveMessage triggered:', message);
        callback(message);
    });

    socket.on('newMessage', (message) => {
        console.log('Socket event newMessage triggered:', message);
        callback(message);
    });

    // Thêm sự kiện updateMessage nếu server có
    socket.on('updateMessage', (message) => {
        console.log('Socket event updateMessage triggered:', message);
        callback(message);
    });
};

// Hủy đăng ký nhận tin nhắn
export const unsubscribeFromMessages = (callback) => {
    if (!socket) return;

    socket.off('receiveMessage', callback);
    socket.off('newMessage', callback);
};

// Đăng ký sự kiện đang nhập
export const subscribeToTyping = (callback) => {
    if (!socket) {
        socket = initializeSocket();
    }

    socket.on('typing', callback);
};

// Hủy đăng ký sự kiện đang nhập
export const unsubscribeFromTyping = (callback) => {
    if (!socket) return;

    socket.off('typing', callback);
};

// Gửi trạng thái đang nhập
export const emitTyping = (conversationId, isTyping = true) => {
    if (!socket) {
        socket = initializeSocket();
    }

    if (!conversationId) return;

    const user = getUser();
    socket.emit('typing', {
        conversationId,
        userId: user?._id,
        isTyping
    });
};

// Tham gia phòng chat
export const joinConversation = (conversationId) => {
    if (!socket) {
        socket = initializeSocket();
    }

    if (!conversationId) return;

    socket.emit('joinConversation', { conversationId });
    console.log('Joined conversation:', conversationId);
};

// Rời phòng chat
export const leaveConversation = (conversationId) => {
    if (!socket) return;

    if (!conversationId) return;

    socket.emit('leaveConversation', { conversationId });
    console.log('Left conversation:', conversationId);
};

// Đánh dấu tin nhắn đã đọc
export const markMessageAsRead = (messageId, conversationId) => {
    if (!socket || !messageId || !conversationId) return;

    const user = getUser();
    socket.emit('messageRead', {
        messageId,
        conversationId,
        readBy: user?._id
    });
};

export default socket;
