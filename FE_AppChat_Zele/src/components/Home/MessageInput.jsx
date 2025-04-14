import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import {
    AttachFile as AttachFileIcon,
    TagFaces as EmojiIcon,
    Mic as MicIcon,
    Send as SendIcon
} from '@mui/icons-material';
import axios from 'axios';

const MessageInput = ({ selectedFriend, onMessageSent }) => {
    const [messageContent, setMessageContent] = useState('');
    const token = localStorage.getItem('accessToken');

    const updateLastMessage = (recipientId, messageContent) => {
        let storedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
        storedUsers = storedUsers.map((user) => {
            if (user._id === recipientId) {
                return { ...user, lastMessage: messageContent };
            }
            return user;
        });
        localStorage.setItem('savedUsers', JSON.stringify(storedUsers));
    };

    const handleSendMessage = async () => {
        if (!selectedFriend || !messageContent.trim()) return;

        try {
            await axios.post(
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

            updateLastMessage(selectedFriend._id, messageContent);
            setMessageContent('');
            if (onMessageSent) onMessageSent();
        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error);
        }
    };


    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
     console.log("Nội dung tin nhắn:", messageContent);
    console.log("Người nhận:", selectedFriend._id);


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
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ mx: 1 }}
                disabled={!selectedFriend}
            />

            <IconButton><MicIcon /></IconButton>
            <IconButton 
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || !selectedFriend}
            >
                <SendIcon />
            </IconButton>
        </Box>
    );
};

export default MessageInput;
