import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Avatar, IconButton
} from '@mui/material';
import {
    Search as SearchIcon, MoreVert as MoreVertIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import {
    initializeSocket,
    joinConversation,
    leaveConversation,
    emitTyping,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToTyping,
    unsubscribeFromTyping,
    markMessageAsRead,
    emitMessage
} from '../../socket/socket';
import socket from '../../socket/socket';

const ChatWindow = ({ selectedFriend, setSelectedFriend }) => {
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [readStatus, setReadStatus] = useState({});
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?._id;
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const fetchMessages = async (convoId) => {
        try {
            setIsLoading(true);
            const res = await axios.get(`http://localhost:5000/api/message/getByConversation/${convoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data.data);
            
            // Mark all messages as read
            socket.emit('batchMarkAsRead', {
                conversationId: convoId,
                readBy: userId
            });
        } catch (error) {
            console.error("❗ Lỗi lấy tin nhắn", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-scroll to bottom with improved behavior
    useEffect(() => {
        // Immediate scroll for initial load
        messagesEndRef.current?.scrollIntoView();
        
        // Smooth scroll for updates
        const timeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        return () => clearTimeout(timeout);
    }, [messages]);

    // Initialize socket connection
    useEffect(() => {
        initializeSocket();
        
        // Listen for new messages and refresh conversation data
        socket.on('receiveMessage', (message) => {
            console.log('Received message through global socket listener:', message);
            
            // If we have a selected friend and message is from them, refresh messages
            if (selectedFriend && 
                (message.senderId === selectedFriend._id || message.sender_id === selectedFriend._id) && 
                conversationId) {
                console.log('Refreshing messages for current conversation');
                fetchMessages(conversationId);
            }
            
            // If no conversation is established yet but message is from current selected friend
            // re-fetch the conversation (might be created on the server)
            if (selectedFriend && 
                (message.senderId === selectedFriend._id || message.sender_id === selectedFriend._id) && 
                !conversationId) {
                fetchConversationId();
            }
        });
        
        return () => {
            socket.off('receiveMessage');
        };
    }, [selectedFriend, conversationId]);

    // Extract fetchConversationId to its own function to be reusable
    const fetchConversationId = async () => {
        if (!selectedFriend) return;
        
        try {
            setIsLoading(true);
            const res = await axios.get('http://localhost:5000/api/conversation/getAll', {
                headers: { Authorization: `Bearer ${token}` },
                'Content-Type': 'application/json'
            });

            const found = res.data.data.find(convo => {
                const ids = convo.participants.map(p => p.user_id);
                return ids.includes(userId) && ids.includes(selectedFriend._id);
            });

            setConversationId(found?._id || null);
            
            // If no conversation exists, create new one
            if (!found) {
                createNewConversation();
            }
        } catch (err) {
            console.error("❗ Lỗi lấy conversation:", err.response || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch conversation ID when selected friend changes
    useEffect(() => {
        if (selectedFriend) {
            fetchConversationId();
        }
    }, [selectedFriend]);

    // Socket event handling for the current conversation
    useEffect(() => {
        if (!conversationId) return;

        // Join conversation room
        joinConversation(conversationId);

        // Handle incoming messages
        const handleReceiveMessage = (newMsg) => {
            console.log('Nhận tin nhắn mới từ socket:', newMsg);
            
            // Verify the message has a valid conversation ID
            if (!newMsg) {
                console.warn('Tin nhắn rỗng từ socket');
                return;
            }
            
            // Lấy conversation ID từ nhiều nguồn khác nhau có thể có
            const msgConversationId = newMsg.conversationId || newMsg.conversation_id;
            
            console.log('So sánh conversationId:', {
                'Conversation hiện tại': conversationId,
                'Conversation của tin nhắn': msgConversationId,
                'Có trùng không': msgConversationId === conversationId
            });
            
            // Fix: Bỏ qua kiểm tra conversationId vì đôi khi tin nhắn không có trường này
            // Chúng ta sẽ kiểm tra dựa trên người gửi/nhận
            const isSenderOrReceiver = 
                (newMsg.sender_id?._id === selectedFriend?._id || newMsg.sender_id === selectedFriend?._id) ||
                (newMsg.senderId === selectedFriend?._id) ||
                (newMsg.receiver_id?._id === userId || newMsg.receiverId === userId);
                
            if (isSenderOrReceiver || msgConversationId === conversationId) {
                // Normalize message format to ensure consistent display
                const formattedMsg = normalizeMessageFormat(newMsg);

                console.log('Đã xử lý tin nhắn, sẽ cập nhật giao diện với:', formattedMsg);
                
                // Update messages state immediately, avoiding duplicates
                setMessages(prevMessages => {
                    // Check if message already exists
                    const exists = prevMessages.some(msg => 
                        msg._id === formattedMsg._id || 
                        (msg._id.includes('temp_') && formattedMsg.tempId === msg._id)
                    );
                    
                    if (exists) {
                        console.log('Tin nhắn đã tồn tại, cập nhật:', formattedMsg._id);
                        return prevMessages.map(msg => {
                            if (msg._id === formattedMsg._id || 
                                (msg._id.includes('temp_') && formattedMsg.tempId === msg._id)) {
                                return formattedMsg;
                            }
                            return msg;
                        });
                    }
                    
                    console.log('Thêm tin nhắn mới vào danh sách UI:', formattedMsg._id);
                    // Add new message
                    const newMessages = [...prevMessages, formattedMsg];
                    
                    // Force scroll to bottom
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                    
                    return newMessages.sort((a, b) => 
                        new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
                    );
                });
                
                // Mark message as read
                if (formattedMsg.sender_id._id !== userId) {
                    markMessageAsRead(formattedMsg._id, conversationId);
                }
            }
        };

        // Handle typing indicators
        const handleTypingIndicator = ({ userId: typingUserId, conversationId: convoId, isTyping }) => {
            if (convoId === conversationId && typingUserId === selectedFriend._id) {
                setIsTyping(isTyping);
            }
        };

        // Subscribe to socket events
        subscribeToMessages(handleReceiveMessage);
        subscribeToTyping(handleTypingIndicator);

        // Cleanup when unmounting or conversation changes
        return () => {
            leaveConversation(conversationId);
            unsubscribeFromMessages(handleReceiveMessage);
            unsubscribeFromTyping(handleTypingIndicator);
        };
    }, [conversationId, selectedFriend?._id, userId]);

    // Normalize message format to ensure consistent structure
    const normalizeMessageFormat = (message) => {
        const formattedMsg = { ...message };
        
        console.log('Chuẩn hóa tin nhắn từ:', formattedMsg);
        
        // Ensure sender_id has correct format
        if (!formattedMsg.sender_id || typeof formattedMsg.sender_id === 'string') {
            formattedMsg.sender_id = { 
                _id: formattedMsg.sender_id || formattedMsg.senderId || userId 
            };
        }
        
        // Ensure message has an ID
        if (!formattedMsg._id) {
            formattedMsg._id = formattedMsg.id || `temp_${Date.now()}`;
        }
        
        // Ensure message has a timestamp
        if (!formattedMsg.timestamp) {
            formattedMsg.timestamp = formattedMsg.createdAt || new Date().toISOString();
        }
        
        // Ensure message has content
        if (!formattedMsg.content && formattedMsg.message) {
            formattedMsg.content = formattedMsg.message;
        }
        
        console.log('Đã chuẩn hóa tin nhắn thành:', formattedMsg);
        return formattedMsg;
    };

    // Create a new conversation if none exists
    const createNewConversation = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/conversation/create', 
                { participants: [userId, selectedFriend._id] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setConversationId(res.data.data._id);
        } catch (err) {
            console.error("Error creating conversation:", err);
        }
    };

    // Fetch messages when conversation ID changes
    useEffect(() => {
        if (conversationId) {
            fetchMessages(conversationId);
        } else {
            setMessages([]);
        }
    }, [conversationId]);

    // Send a new message - cải thiện xử lý real-time
    const sendMessage = (message) => {
        if (!conversationId) {
            console.error('Không thể gửi tin nhắn: conversationId không tồn tại');
            return;
        }
        
        // Create temporary ID and timestamp
        const tempId = `temp_${Date.now()}`;
        const timestamp = new Date().toISOString();
        
        // Create new message with consistent format
        const newMessage = {
            ...message,
            _id: tempId,
            tempId: tempId,
            conversationId,
            conversation_id: conversationId,
            sender_id: { _id: userId },
            senderId: userId,
            timestamp,
            createdAt: timestamp,
            read: false,
            message_type: 'text'  // Đảm bảo có message_type
        };
        
        console.log('Gửi tin nhắn mới với ID tạm thời:', tempId);
        
        // Update UI immediately with optimistic update
        setMessages(prev => [...prev, newMessage]);
        
        // Force scroll to bottom for new message
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
        
        // Send message via socket với đầy đủ thông tin
        emitMessage({
            ...message,
            tempId,
            conversationId,
            senderId: userId,
            sender_id: userId,  // Thêm cả dạng snake_case
            participants: [userId, selectedFriend._id],
            timestamp, // Thêm timestamp
            createdAt: timestamp, // Thêm createdAt
            message_type: 'text'  // Đảm bảo có message_type
        });
        
        // Clear typing indicator
        handleStopTyping();
    };

    // Handle typing indicators
    const handleStartTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        emitTyping(conversationId, true);
        
        // Auto-clear typing status after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
            handleStopTyping();
        }, 3000);
    };
    
    const handleStopTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        emitTyping(conversationId, false);
    };

    const handleBackClick = () => {
        setSelectedFriend(null);
    };

    return (
        <Box flex={1} display="flex" flexDirection="column">
            {/* Header */}
            <Box p={1.5} bgcolor="white" display="flex" alignItems="center" borderBottom="1px solid #e5e5e5">
                <IconButton sx={{ display: { sm: 'none' }, mr: 1 }} onClick={handleBackClick}>
                    <ArrowBackIcon />
                </IconButton>
                <Avatar src={selectedFriend?.avatar || ''} sx={{ mr: 2 }} />
                <Box flex={1}>
                    <Typography fontWeight="bold">{selectedFriend?.name || 'Tên người dùng'}</Typography>
                    <Typography variant="caption" color="textSecondary">
                        {isTyping ? 'Đang nhập...' : (selectedFriend?.online ? 'Online' : 'Offline')}
                    </Typography>
                </Box>
                <IconButton><SearchIcon /></IconButton>
                <IconButton><MoreVertIcon /></IconButton>
            </Box>

            {/* Message area */}
            <Box flex={1} p={2} overflow="auto" bgcolor="#e5efff"
                sx={{
                    backgroundImage: 'url(https://zalo.zadn.vn/web/assets/img/background-chat.7d3e1e8b.png)',
                    backgroundSize: 'cover'
                }}
            >
                {isLoading ? (
                    <Typography align="center" py={2}>Đang tải tin nhắn...</Typography>
                ) : messages.length > 0 ? (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg._id}
                            sender={msg.sender_id._id}
                            content={msg.content}
                            time={new Date(msg.timestamp).toLocaleTimeString()}
                            userId={userId}
                            isRead={readStatus[msg._id]?.includes(selectedFriend._id)}
                        />
                    ))
                ) : (
                    <Typography variant="body2" color="textSecondary" align="center">
                        Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện ngay!
                    </Typography>
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <MessageInput
                selectedFriend={selectedFriend}
                conversationId={conversationId}
                onMessageSent={sendMessage}
                onTypingStarted={handleStartTyping}
                onTypingStopped={handleStopTyping}
                disabled={!conversationId || isLoading}
            />
        </Box>
    );
};

export default ChatWindow;
