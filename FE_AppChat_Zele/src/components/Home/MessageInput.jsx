import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import {
    AttachFile as AttachFileIcon,
    TagFaces as EmojiIcon,
    Mic as MicIcon,
    Send as SendIcon
} from '@mui/icons-material';
import axios from 'axios';

const MessageInput = ({ selectedFriend}) => {
    const [messageContent, setMessageContent] = useState('');
    const token = localStorage.getItem('accessToken'); // Lấy token từ localStorage


    // Gửi tin nhắn
    const handleSendMessage = async () => {
        if (messageContent.trim()) {
            try {
                await axios.post(
                    'http://localhost:5000/api/message/send',
                    {
                        content: messageContent,
                        recipientId: selectedFriend._id
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                setMessageContent(''); // Reset content after sending
            } catch (error) {
                console.error("Lỗi khi gửi tin nhắn:", error);
            }
        }
    };

    return (
        <Box 
            p={2} 
            bgcolor="white" 
            borderTop="1px solid #e5e5e5"
            display="flex"
            alignItems="center"
        >
            {/* Nút đính kèm file */}
            <IconButton>
                <AttachFileIcon />
            </IconButton>

            {/* Nút emoji */}
            <IconButton>
                <EmojiIcon />
            </IconButton>

            {/* Ô nhập tin nhắn */}
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Nhập tin nhắn..."
                size="small"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                sx={{ mx: 1 }}
            />

            {/* Nút ghi âm */}
            <IconButton>
                <MicIcon />
            </IconButton>

            {/* Nút gửi tin nhắn */}
            <IconButton onClick={handleSendMessage}>
                <SendIcon />
            </IconButton>
        </Box>
    );
};

export default MessageInput;
