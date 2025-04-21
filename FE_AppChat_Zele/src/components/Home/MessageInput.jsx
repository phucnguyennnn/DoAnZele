import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import {
    AttachFile as AttachFileIcon,
    TagFaces as EmojiIcon,
    Mic as MicIcon,
    Send as SendIcon
} from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';

const MessageInput = ({ selectedFriend, conversationId, onMessageSent, onTypingStarted, onTypingStopped, disabled }) => {
    const [messageContent, setMessageContent] = useState('');
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const updateLastMessage = (recipientId, messageContent) => {
        let saved = JSON.parse(localStorage.getItem('savedUsers')) || [];
        saved = saved.map(user =>
            user._id === recipientId ? { ...user, lastMessage: messageContent } : user
        );
        localStorage.setItem('savedUsers', JSON.stringify(saved));
    };

    const handleSendMessage = async () => {
        if (!selectedFriend || !messageContent.trim() || !conversationId) return;

        try {
            const res = await axios.post(
                'http://localhost:5000/api/message/send',
                {
                    receiverId: selectedFriend._id,
                    message_type: 'text',
                    content: messageContent,
                    file_id: null
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const sentMessage = res.data.data;

            // 🔄 Cập nhật tin nhắn cuối cùng vào localStorage
            updateLastMessage(selectedFriend._id, messageContent);

            // 🔄 Xóa nội dung input
            setMessageContent('');

            // ✅ Gửi socket đến người nhận
            socket.emit('sendMessage', {
                senderId: sentMessage.sender_id,     // ID người gửi
                receiverId: selectedFriend._id,      // ID người nhận
                conversation_id: conversationId,
                conversationId: conversationId,      // Thêm dạng camelCase cho nhất quán
                content: messageContent,
                _id: sentMessage._id,                // ID tin nhắn
                createdAt: sentMessage.createdAt,    // thời gian gửi
                participants: [user._id, selectedFriend._id] // Thêm participants để xử lý notification
            });

            // ✅ Hiển thị ngay ở UI của người gửi
            if (onMessageSent) onMessageSent(sentMessage);

            // ✅ Dừng chỉ báo đang nhập khi gửi tin nhắn
            if (onTypingStopped) onTypingStopped();

        } catch (error) {
            console.error("❗ Lỗi gửi tin nhắn:", error);
        }
    };

    const handleChange = (e) => {
        setMessageContent(e.target.value);
        // Emit typing event when user is typing
        if (onTypingStarted && e.target.value.trim()) {
            onTypingStarted();
        } else if (onTypingStopped && !e.target.value.trim()) {
            onTypingStopped();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Stop typing indicator when component unmounts
    useEffect(() => {
        return () => {
            if (onTypingStopped) onTypingStopped();
        };
    }, [onTypingStopped]);

    return (
        <Box
            p={2}
            bgcolor="white"
            borderTop="1px solid #e5e5e5"
            display="flex"
            alignItems="center"
        >
            <IconButton><AttachFileIcon /></IconButton>
            <IconButton><EmojiIcon /></IconButton>

            <TextField
                fullWidth
                variant="outlined"
                placeholder={selectedFriend ? "Nhập tin nhắn..." : "Chọn người để nhắn..."}
                size="small"
                value={messageContent}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onFocus={() => messageContent.trim() && onTypingStarted && onTypingStarted()}
                onBlur={() => onTypingStopped && onTypingStopped()}
                sx={{ mx: 1 }}
                disabled={!selectedFriend || disabled}
            />

            <IconButton><MicIcon /></IconButton>
            <IconButton
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || !selectedFriend || disabled}
            >
                <SendIcon />
            </IconButton>
        </Box>
    );
};

export default MessageInput;
