import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Avatar, IconButton, CircularProgress, Divider
} from '@mui/material';
import {
    Search as SearchIcon, MoreVert as MoreVertIcon, ArrowBack as ArrowBackIcon,
    Group as GroupIcon, Settings as SettingsIcon
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
import GroupSettings from '../Group/GroupSettings';

const ChatWindow = ({ selectedFriend, setSelectedFriend }) => {
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [readStatus, setReadStatus] = useState({});
    const [groupData, setGroupData] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [onlineMembers, setOnlineMembers] = useState([]);
    
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?._id;
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Determine if this is a group chat
    const isGroupChat = selectedFriend?.isGroup || false;

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

    // Fetch group details if it's a group chat
    const fetchGroupDetails = async (groupId) => {
        if (!groupId) return;
        
        try {
            setIsLoading(true);
            const response = await axios.get(
                `http://localhost:5000/api/group/${groupId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data && response.data.status === 'success') {
                setGroupData(response.data.data);
                
                // Set conversation ID from the group data
                if (response.data.data.conversation_id) {
                    setConversationId(response.data.data.conversation_id);
                }
                
                // Update online members count
                updateOnlineMembers(response.data.data.members);
            }
        } catch (error) {
            console.error('Error loading group details:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Update online members based on currently online users
    const updateOnlineMembers = (members) => {
        if (!members) return;
        
        const onlineIds = [];
        members.forEach(member => {
            const memberId = member.user._id || member.user;
            if (socket.onlineUsers && socket.onlineUsers.includes(memberId)) {
                onlineIds.push(memberId);
            }
        });
        
        setOnlineMembers(onlineIds);
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
        
        // Listen for group messages
        socket.on('receiveGroupMessage', (data) => {
            if (isGroupChat && data.conversationId === conversationId) {
                fetchMessages(conversationId);
            }
        });
        
        // Listen for group updates
        socket.on('groupInfoUpdated', (data) => {
            if (isGroupChat && selectedFriend?.groupId === data.groupId) {
                fetchGroupDetails(selectedFriend.groupId);
            }
        });
        
        // Listen for online users updates
        socket.on('onlineUsers', (onlineUsersList) => {
            if (groupData) {
                updateOnlineMembers(groupData.members);
            }
        });
        
        return () => {
            socket.off('receiveMessage');
            socket.off('receiveGroupMessage');
            socket.off('groupInfoUpdated');
            socket.off('onlineUsers');
        };
    }, [selectedFriend, conversationId, isGroupChat, groupData]);

    // Extract fetchConversationId to its own function to be reusable
    const fetchConversationId = async () => {
        if (!selectedFriend) return;
        
        // If it's a group and we already have the conversation ID from the group data
        if (isGroupChat && selectedFriend.conversationId) {
            setConversationId(selectedFriend.conversationId);
            return;
        }
        
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

    // Setup logic when selected friend changes
    useEffect(() => {
        if (!selectedFriend) return;
        
        if (isGroupChat) {
            // It's a group chat
            fetchGroupDetails(selectedFriend.groupId);
        } else {
            // It's an individual chat
            fetchConversationId();
        }
        
        // Reset states
        setMessages([]);
        setIsTyping(false);
        setReadStatus({});
        
    }, [selectedFriend, isGroupChat]);

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
                
            // For group messages, check if conversation ID matches
            const isGroupMessage = isGroupChat && (msgConversationId === conversationId);
                
            if (isSenderOrReceiver || isGroupMessage || msgConversationId === conversationId) {
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
    }, [conversationId, selectedFriend?._id, userId, isGroupChat]);

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

    // Get the name of a message sender in group chat
    const getSenderName = (senderId) => {
        if (!groupData || !senderId) return 'Unknown';
        
        const member = groupData.members.find(m => 
            (m.user._id ? m.user._id === senderId : m.user === senderId)
        );
        
        return member?.user?.name || 'Unknown User';
    };
    
    // Get the avatar of a message sender in group chat
    const getSenderAvatar = (senderId) => {
        if (!groupData || !senderId) return '';
        
        const member = groupData.members.find(m => 
            (m.user._id ? m.user._id === senderId : m.user === senderId)
        );
        
        return member?.user?.primary_avatar || '';
    };
    
    // Check if a user can send messages in this group
    const canSendMessages = () => {
        if (!isGroupChat || !groupData) return true;
        
        const userRole = groupData.members.find(m => 
            (m.user._id ? m.user._id === userId : m.user === userId)
        )?.role;
        
        if (!userRole) return false;
        
        const sendMessagesSetting = groupData.settings?.who_can_send_messages || 'all';
        
        if (sendMessagesSetting === 'all') return true;
        if (sendMessagesSetting === 'admins_moderators' && ['admin', 'moderator'].includes(userRole)) return true;
        if (sendMessagesSetting === 'admins' && userRole === 'admin') return true;
        
        return false;
    };

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
        
        // Send message via socket with appropriate data
        if (isGroupChat) {
            // For group messages
            emitMessage({
                ...message,
                tempId,
                conversationId,
                senderId: userId,
                sender_id: userId,
                timestamp,
                createdAt: timestamp,
                message_type: 'text',
                isGroupMessage: true,
                groupId: selectedFriend.groupId
            });
        } else {
            // For individual messages
            emitMessage({
                ...message,
                tempId,
                conversationId,
                senderId: userId,
                sender_id: userId,
                participants: [userId, selectedFriend._id],
                timestamp,
                createdAt: timestamp,
                message_type: 'text'
            });
        }
        
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
    
    // Handle opening group settings
    const handleOpenSettings = () => {
        setSettingsOpen(true);
    };
    
    // Handle group settings updates
    const handleGroupUpdate = (updatedGroup) => {
        setGroupData(updatedGroup);
    };
    
    // Handle leaving or deleting group
    const handleLeaveGroup = () => {
        setSelectedFriend(null);
    };

    // Render the header differently for group vs individual chat
    const renderHeader = () => {
        if (isGroupChat) {
            return (
                <Box p={1.5} bgcolor="white" display="flex" alignItems="center" borderBottom="1px solid #e5e5e5">
                    <IconButton sx={{ display: { sm: 'none' }, mr: 1 }} onClick={handleBackClick}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Avatar src={groupData?.avatar || selectedFriend?.avatar || ''} sx={{ mr: 2 }}>
                        {!groupData?.avatar && !selectedFriend?.avatar && <GroupIcon />}
                    </Avatar>
                    <Box flex={1}>
                        <Typography fontWeight="bold">{groupData?.name || selectedFriend?.name || 'Group'}</Typography>
                        <Typography variant="caption" color="textSecondary">
                            {groupData ? `${groupData.members.length} members • ${onlineMembers.length} online` : 'Loading...'}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleOpenSettings}><SettingsIcon /></IconButton>
                    <IconButton><MoreVertIcon /></IconButton>
                </Box>
            );
        } else {
            return (
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
            );
        }
    };
    
    // Render messages differently for group vs individual chat
    const renderMessages = () => {
        if (isLoading) {
            return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
        }
        
        if (messages.length === 0) {
            return (
                <Typography variant="body2" color="textSecondary" align="center" my={4}>
                    Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện ngay!
                </Typography>
            );
        }
        
        return messages.map((msg) => (
            <MessageBubble
                key={msg._id}
                sender={msg.sender_id._id || msg.sender_id}
                content={msg.content}
                time={new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                userId={userId}
                isRead={readStatus[msg._id]?.includes(selectedFriend._id)}
                messageType={msg.message_type}
                fileUrl={msg.file_meta?.url}
                fileName={msg.file_meta?.name}
                isRevoked={msg.is_revoked}
                senderName={selectedFriend.isGroup ? getSenderName(msg.sender_id._id || msg.sender_id) : null}
                senderAvatar={selectedFriend.isGroup ? getSenderAvatar(msg.sender_id._id || msg.sender_id) : selectedFriend.avatar}
            />
        ));
    };

    return (
        <Box flex={1} display="flex" flexDirection="column">
            {/* Header */}
            {renderHeader()}

            {/* Message area */}
            <Box 
                flex={1} 
                p={2} 
                overflow="auto" 
                bgcolor="#e5efff"
                sx={{
                    backgroundImage: 'url(https://zalo.zadn.vn/web/assets/img/background-chat.7d3e1e8b.png)',
                    backgroundSize: 'cover'
                }}
            >
                {renderMessages()}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <MessageInput
                selectedFriend={selectedFriend}
                conversationId={conversationId}
                onMessageSent={sendMessage}
                onTypingStarted={handleStartTyping}
                onTypingStopped={handleStopTyping}
                disabled={!conversationId || isLoading || (isGroupChat && !canSendMessages())}
                disabledMessage={isGroupChat && !canSendMessages() ? "You don't have permission to send messages in this group" : ""}
            />
            
            {/* Group Settings Dialog */}
            {isGroupChat && groupData && (
                <GroupSettings
                    open={settingsOpen}
                    group={groupData}
                    onClose={() => setSettingsOpen(false)}
                    onUpdate={handleGroupUpdate}
                    onDelete={handleLeaveGroup}
                />
            )}
        </Box>
    );
};

export default ChatWindow;
