import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Tooltip, CircularProgress, Typography } from '@mui/material';
import {
    AttachFile as AttachFileIcon,
    TagFaces as EmojiIcon,
    Mic as MicIcon,
    Send as SendIcon,
    Close as CloseIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ 
    selectedFriend, 
    conversationId, 
    onMessageSent, 
    onTypingStarted, 
    onTypingStopped, 
    disabled,
    disabledMessage = ''
}) => {
    const [messageContent, setMessageContent] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);
    
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
        if (!selectedFriend || (!messageContent.trim() && attachments.length === 0) || !conversationId || sending) return;

        try {
            setSending(true);
            console.log('Sending message to:', selectedFriend.isGroup ? 'group' : 'user', selectedFriend);
            console.log('Conversation ID:', conversationId);
            
            let res;
            let formData = new FormData();
            formData.append('content', messageContent);
            
            // Set message type based on attachments
            let messageType = 'text';
            if (attachments.length > 0) {
                const file = attachments[0];
                formData.append('file', file);
                
                if (file.type.startsWith('image/')) {
                    messageType = 'image';
                } else if (file.type.startsWith('video/')) {
                    messageType = 'video';
                } else if (file.type.includes('audio')) {
                    messageType = 'voice';
                } else {
                    messageType = 'file';
                }
            }
            formData.append('message_type', messageType);
            
            if (selectedFriend.isGroup) {
                // Group message - Sử dụng endpoint chính xác từ routes
                console.log('Sending group message to conversation:', conversationId);
                
                // Chuẩn bị dữ liệu cần thiết cho tin nhắn nhóm
                formData.append('conversationId', conversationId);
                
                // Sử dụng đúng endpoint từ routes: /api/message/send-group
                res = await axios.post(
                    `http://localhost:5000/api/message/send-group`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                
                console.log('Group message sent successfully:', res.data);
            } else {
                // Individual message
                formData.append('receiverId', selectedFriend._id);
                
                console.log('Sending individual message to:', selectedFriend._id);
                res = await axios.post(
                    'http://localhost:5000/api/message/send',
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                
                // Log success for debugging
                console.log('Individual message sent successfully:', res.data);
                
                // Update last message for individuals
                updateLastMessage(selectedFriend._id, messageContent);
            }

            const sentMessage = res.data.data;
            
            // Clear content and attachments
            setMessageContent('');
            setAttachments([]);
            setAttachmentPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // Emit socket event based on message type
            if (selectedFriend.isGroup) {
                socket.emit('sendGroupMessage', {
                    senderId: user._id,
                    sender_id: user._id,
                    groupId: selectedFriend.groupId,
                    conversationId: conversationId,
                    conversation_id: conversationId,
                    content: messageContent,
                    message_type: messageType,
                    _id: sentMessage._id,
                    createdAt: sentMessage.createdAt,
                    message: sentMessage
                });
            } else {
                socket.emit('sendMessage', {
                    senderId: sentMessage.sender_id,
                    receiverId: selectedFriend._id,
                    conversation_id: conversationId,
                    conversationId: conversationId,
                    content: messageContent,
                    message_type: messageType,
                    _id: sentMessage._id,
                    createdAt: sentMessage.createdAt,
                    participants: [user._id, selectedFriend._id]
                });
            }

            // Update UI via callback
            if (onMessageSent) onMessageSent(sentMessage);

            // Stop typing indicator
            if (onTypingStopped) onTypingStopped();

        } catch (error) {
            console.error("❗ Lỗi gửi tin nhắn:", error);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Status code:", error.response.status);
                console.error("Requested URL:", error.config?.url);
                console.error("Request method:", error.config?.method);
            }
            
            // Show user-friendly error
            alert(
                error.response?.status === 404 
                    ? "Could not send message: API endpoint not found. Please check API configuration."
                    : "Failed to send message. Please try again."
            );
        } finally {
            setSending(false);
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
    
    const handleEmojiClick = (emojiObject) => {
        setMessageContent(prev => prev + emojiObject.emoji);
    };
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setAttachments([file]);
            
            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                    setAttachmentPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setAttachmentPreview(null);
            }
        }
    };
    
    const removeAttachment = () => {
        setAttachments([]);
        setAttachmentPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Stop typing indicator when component unmounts
    useEffect(() => {
        return () => {
            if (onTypingStopped) onTypingStopped();
        };
    }, [onTypingStopped]);

    // If disabled with a message, show the message
    if (disabled && disabledMessage) {
        return (
            <Box p={2} bgcolor="#f5f5f5" textAlign="center">
                <Typography variant="body2" color="textSecondary">
                    {disabledMessage}
                </Typography>
            </Box>
        );
    }

    return (
        <Box position="relative">
            {showEmojiPicker && (
                <Box position="absolute" bottom="100%" right={0} zIndex={1000} sx={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                </Box>
            )}
            
            {attachmentPreview && (
                <Box 
                    p={1.5} 
                    bgcolor="#f5f5f5" 
                    display="flex" 
                    alignItems="center"
                    justifyContent="space-between"
                    borderTop="1px solid #e0e0e0"
                >
                    <Box display="flex" alignItems="center">
                        {attachmentPreview.startsWith('data:image') ? (
                            <img 
                                src={attachmentPreview} 
                                alt="Preview" 
                                style={{ 
                                    height: 50, 
                                    width: 'auto', 
                                    marginRight: 12, 
                                    borderRadius: 8,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                            />
                        ) : (
                            <Box 
                                sx={{ 
                                    bgcolor: 'primary.main', 
                                    color: 'white',
                                    p: 1,
                                    borderRadius: 1,
                                    mr: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <AttachFileIcon fontSize="small" />
                            </Box>
                        )}
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200, fontWeight: 500 }}>
                            {attachments[0]?.name}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={removeAttachment} sx={{ color: 'text.secondary' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}
            
            <Box
                py={1.5}
                px={2}
                bgcolor="white"
                borderTop="1px solid #e5e5e5"
                display="flex"
                alignItems="center"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                
                <Tooltip title="Đính kèm tệp">
                    <IconButton 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        sx={{ 
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main' }
                        }}
                    >
                        <AttachFileIcon />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Biểu tượng cảm xúc">
                    <IconButton 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={disabled}
                        sx={{ 
                            color: showEmojiPicker ? 'primary.main' : 'text.secondary',
                            '&:hover': { color: 'primary.main' }
                        }}
                    >
                        <EmojiIcon />
                    </IconButton>
                </Tooltip>

                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={selectedFriend ? "Nhập tin nhắn..." : "Chọn một cuộc trò chuyện..."}
                    size="small"
                    value={messageContent}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    onFocus={() => messageContent.trim() && onTypingStarted && onTypingStarted()}
                    onBlur={() => onTypingStopped && onTypingStopped()}
                    multiline
                    maxRows={4}
                    sx={{ 
                        mx: 1.5,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '20px',
                            '& fieldset': {
                                borderColor: '#e0e0e0',
                            },
                            '&:hover fieldset': {
                                borderColor: '#bdbdbd',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'primary.main',
                            }
                        }
                    }}
                    disabled={!selectedFriend || disabled}
                />

                <Tooltip title="Gửi tin nhắn">
                    <span>
                        <IconButton
                            onClick={handleSendMessage}
                            disabled={(!messageContent.trim() && attachments.length === 0) || !selectedFriend || disabled || sending}
                            color="primary"
                            sx={{ 
                                bgcolor: ((!messageContent.trim() && attachments.length === 0) || !selectedFriend || disabled || sending) 
                                    ? 'transparent' 
                                    : 'primary.main',
                                color: ((!messageContent.trim() && attachments.length === 0) || !selectedFriend || disabled || sending) 
                                    ? 'action.disabled' 
                                    : 'white',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                                transition: 'all 0.2s'
                            }}
                        >
                            {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );
};

export default MessageInput;
