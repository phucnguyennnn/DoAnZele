import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    TextField,
    InputAdornment,
    Typography,
    Badge,
    Avatar,
    Menu,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    CircularProgress
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';

const ChatList = ({ selectedFriend, setSelectedFriend }) => {
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [savedUsers, setSavedUsers] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState({});

    const token = localStorage.getItem('accessToken');
    const rawUser = localStorage.getItem('user');
    const user = JSON.parse(rawUser); 
    const userId = user?._id;

    // Effect for socket connection and events
    useEffect(() => {
        const storedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
        setSavedUsers(storedUsers);
        loadChatListWithLastMessages();

        // Socket events for user status
        socket.on('userOnline', (userData) => {
            setOnlineUsers(prev => ({...prev, [userData.userId]: true}));
        });

        socket.on('userOffline', (userData) => {
            setOnlineUsers(prev => ({...prev, [userData.userId]: false}));
        });

        // Socket events for messages
        socket.on('receiveMessage', (message) => {
            // Update chat list when receiving new message
            loadChatListWithLastMessages();
        });

        socket.on('messageUpdated', () => {
            // Update when message is edited or revoked
            loadChatListWithLastMessages();
        });

        // Request initial online users
        socket.emit('getOnlineUsers');
        socket.on('onlineUsers', (users) => {
            const onlineMap = {};
            users.forEach(userId => {
                onlineMap[userId] = true;
            });
            setOnlineUsers(onlineMap);
        });

        return () => {
            socket.off('userOnline');
            socket.off('userOffline');
            socket.off('receiveMessage');
            socket.off('messageUpdated');
            socket.off('onlineUsers');
        };
    }, []);

    // Handle search input
    const handleSearch = async (e) => {
        if (e.key === 'Enter' && searchId.trim()) {
            try {
                setLoading(true);
                console.log("Searching for user with email:", searchId.trim());
                const res = await axios.get(
                    `http://localhost:5000/api/user/getUser?email=${searchId.trim()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                
                if (res.data && res.data.data) {
                    const foundUser = {
                        ...res.data.data,
                        last_message: res.data.data.conversation?.last_message?.content || null,
                        lastMessageTime: res.data.data.conversation?.last_message?.createdAt || new Date()
                    };
                    saveUserToLocalStorage(foundUser);
                    setSearchId(''); // Clear search after success
                }
            } catch (error) {
                console.error("Error searching user:", error.response || error.message);
                // You could add a toast notification here
            } finally {
                setLoading(false);
            }
        }
    };

    // Load chat list with last messages
    const loadChatListWithLastMessages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/conversation/getAll", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const conversations = res.data.data;
            
            const users = conversations.map((convo) => {
                const otherParticipant = convo.participants.find(p => p.user_id !== userId);
                
                if (!otherParticipant) return null;
                
                return {
                    _id: otherParticipant.user_id,
                    name: otherParticipant.name || "Người dùng",
                    avatar: otherParticipant.avatar || "",
                    lastMessage: convo.last_message?.content || "Chưa có tin nhắn nào",
                    lastMessageTime: convo.last_message?.createdAt || new Date(),
                    unreadCount: convo.unreadCount || 0,
                    conversationId: convo._id
                };
            }).filter(user => user !== null);
            
            // Sort by most recent message
            users.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            
            localStorage.setItem("savedUsers", JSON.stringify(users));
            setSavedUsers(users);
        } catch (err) {
            console.error("Lỗi khi lấy danh sách hội thoại:", err);
            // Fallback to local storage
            const storedUsers = JSON.parse(localStorage.getItem("savedUsers")) || [];
            setSavedUsers(storedUsers);
        } finally {
            setLoading(false);
        }
    }, [token, userId]);

    // Save user to localStorage
    const saveUserToLocalStorage = (userData) => {
        let storedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
        // Check if user already exists
        const existingUserIndex = storedUsers.findIndex(user => user._id === userData._id);
        
        if (existingUserIndex >= 0) {
            // Update existing user
            storedUsers[existingUserIndex] = {...storedUsers[existingUserIndex], ...userData};
        } else {
            // Add new user
            storedUsers.push(userData);
        }
        
        localStorage.setItem('savedUsers', JSON.stringify(storedUsers));
        setSavedUsers(storedUsers);
    };

    // Format the time for display
    const formatTime = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        
        // Check if it's today
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Check if it's yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua';
        }
        
        // Otherwise show date
        return date.toLocaleDateString();
    };

    // Context menu (right click) event handlers
    const handleRightClick = (event, user) => {
        event.preventDefault();
        setSelectedUserToDelete(user);
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleDeleteUser = () => {
        setOpenConfirmDialog(true);
        handleCloseMenu();
    };

    const handleConfirmDelete = () => {
        if (!selectedUserToDelete) return;
        removeUserFromLocalStorage(selectedUserToDelete._id);
        if (selectedFriend?._id === selectedUserToDelete._id) {
            setSelectedFriend(null);
        }
        setOpenConfirmDialog(false);
    };

    const handleCancelDelete = () => {
        setOpenConfirmDialog(false);
        setSelectedUserToDelete(null);
    };

    // Remove user from localStorage
    const removeUserFromLocalStorage = (userId) => {
        let storedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
        storedUsers = storedUsers.filter((user) => user._id !== userId);
        localStorage.setItem('savedUsers', JSON.stringify(storedUsers));
        setSavedUsers(storedUsers);
    };

    return (
        <Box width="360px" bgcolor="white" display="flex" flexDirection="column" borderRight="1px solid #e5e5e5">
            <Box p={2} bgcolor="#f5f5f5">
                <TextField
                    fullWidth
                    placeholder="Nhập email để tìm..."
                    variant="outlined"
                    size="small"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyDown={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                {loading ? <CircularProgress size={20} /> : <SearchIcon color="disabled" />}
                            </InputAdornment>
                        ),
                        sx: {
                            backgroundColor: 'white',
                            borderRadius: '20px'
                        }
                    }}
                />
            </Box>

            <Box flex={1} overflow="auto">
                <List disablePadding>
                    {savedUsers.length > 0 ? (
                        savedUsers.map((userItem) => (
                            <div key={userItem._id}>
                                <ListItem
                                    button
                                    alignItems="flex-start"
                                    selected={selectedFriend?._id === userItem._id}
                                    onClick={() => setSelectedFriend(userItem)}
                                    onContextMenu={(e) => handleRightClick(e, userItem)}
                                    sx={{
                                        '&.Mui-selected': {
                                            backgroundColor: '#e5efff',
                                        },
                                        '&.Mui-selected:hover': {
                                            backgroundColor: '#e5efff',
                                        },
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                            color="success"
                                            invisible={!onlineUsers[userItem._id]}
                                        >
                                            <Avatar src={userItem.avatar || ''} />
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography fontWeight={userItem.unreadCount > 0 ? 'bold' : 'normal'}>
                                                    {userItem.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {formatTime(userItem.lastMessageTime)}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography 
                                                    variant="body2"
                                                    color={userItem.unreadCount > 0 ? 'primary' : 'textSecondary'}
                                                    fontWeight={userItem.unreadCount > 0 ? 'bold' : 'normal'}
                                                    noWrap
                                                    sx={{ maxWidth: '200px' }}
                                                >
                                                    {userItem.lastMessage || 'Chưa có tin nhắn nào'}
                                                </Typography>
                                                {userItem.unreadCount > 0 && (
                                                    <Badge 
                                                        badgeContent={userItem.unreadCount} 
                                                        color="primary" 
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </div>
                        ))
                    ) : (
                        <Typography color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                            {loading ? 'Đang tải...' : 'Không có cuộc trò chuyện nào. Tìm người dùng để bắt đầu trò chuyện.'}
                        </Typography>
                    )}
                </List>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleDeleteUser}>Xóa</MenuItem>
            </Menu>

            <Dialog
                open={openConfirmDialog}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Xác nhận</DialogTitle>
                <DialogContent>
                    <Typography>Bạn có chắc chắn muốn xóa người dùng này không?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Hủy</Button>
                    <Button onClick={handleConfirmDelete} color="secondary">Xóa</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ChatList;
