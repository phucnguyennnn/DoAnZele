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
    CircularProgress,
    IconButton,
    Tabs,
    Tab,
    Tooltip
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Link as LinkIcon } from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';
import CreateGroupDialog from '../Group/CreateGroupDialog';
import JoinGroupDialog from '../Group/JoinGroupDialog';

const ChatList = ({ selectedFriend, setSelectedFriend }) => {
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [savedUsers, setSavedUsers] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState({});

    const [tabValue, setTabValue] = useState(0);
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [joinGroupOpen, setJoinGroupOpen] = useState(false);

    const token = localStorage.getItem('accessToken');
    const rawUser = localStorage.getItem('user');
    const user = JSON.parse(rawUser); 
    const userId = user?._id;

    useEffect(() => {
        const storedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
        setSavedUsers(storedUsers);
        loadChatListWithLastMessages();
        loadGroups();

        socket.on('userOnline', (userData) => {
            setOnlineUsers(prev => ({...prev, [userData.userId]: true}));
        });

        socket.on('userOffline', (userData) => {
            setOnlineUsers(prev => ({...prev, [userData.userId]: false}));
        });

        socket.on('receiveMessage', (message) => {
            loadChatListWithLastMessages();
        });

        socket.on('messageUpdated', () => {
            loadChatListWithLastMessages();
        });

        socket.on('newGroupCreated', (data) => {
            loadGroups();
        });

        socket.on('memberAddedToGroup', (data) => {
            loadGroups();
        });

        socket.on('memberRemovedFromGroup', (data) => {
            loadGroups();
        });

        socket.on('groupInfoUpdated', (data) => {
            loadGroups();
        });

        socket.on('addedToGroup', (data) => {
            loadGroups();
        });

        socket.on('removedFromGroup', (data) => {
            loadGroups();
            if (selectedFriend && selectedFriend.groupId === data.groupId) {
                setSelectedFriend(null);
            }
        });

        socket.on('groupDeleted', (data) => {
            loadGroups();
            if (selectedFriend && selectedFriend.groupId === data.groupId) {
                setSelectedFriend(null);
            }
        });

        socket.on('receiveGroupMessage', () => {
            loadGroups();
        });

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
            socket.off('newGroupCreated');
            socket.off('memberAddedToGroup');
            socket.off('memberRemovedFromGroup');
            socket.off('groupInfoUpdated');
            socket.off('addedToGroup');
            socket.off('removedFromGroup');
            socket.off('groupDeleted');
            socket.off('receiveGroupMessage');
        };
    }, [selectedFriend]);

    const loadGroups = async () => {
        try {
            setGroupsLoading(true);
            const response = await axios.get(
                'http://localhost:5000/api/group',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data && response.data.status === 'success') {
                const formattedGroups = response.data.data.map(group => ({
                    _id: group._id,
                    name: group.name,
                    description: group.description,
                    avatar: group.avatar,
                    members: group.members,
                    creator: group.creator,
                    settings: group.settings,
                    conversation_id: group.conversation_id,
                    conversationId: group.conversation_id,
                    lastMessage: null,
                    lastMessageTime: group.updated_at,
                    unreadCount: 0,
                    isGroup: true,
                    groupId: group._id
                }));
                
                const conversationsResponse = await axios.get(
                    "http://localhost:5000/api/conversation/getAll",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (conversationsResponse.data && conversationsResponse.data.status === 'success') {
                    const conversations = conversationsResponse.data.data;
                    
                    formattedGroups.forEach(group => {
                        const conversation = conversations.find(c => c._id === group.conversationId);
                        if (conversation) {
                            group.lastMessage = conversation.last_message?.content || 'No messages yet';
                            group.lastMessageTime = conversation.last_message?.createdAt || group.lastMessageTime;
                            group.unreadCount = conversation.unreadCount || 0;
                        }
                    });
                }
                
                formattedGroups.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
                
                setGroups(formattedGroups);
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setGroupsLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCreateGroup = (newGroup) => {
        setCreateGroupOpen(false);
        loadGroups();
    };

    const handleJoinGroup = (group) => {
        setJoinGroupOpen(false);
        loadGroups();
        if (group) {
            setSelectedFriend({
                ...group,
                isGroup: true,
                groupId: group._id,
                conversationId: group.conversation_id
            });
        }
    };

    const handleSelectGroup = (group) => {
        setSelectedFriend({
            ...group,
            isGroup: true,
            groupId: group._id,
            conversationId: group.conversationId
        });
    };

    const handleSearch = async (e) => {
        if (e.key === 'Enter' && searchId.trim()) {
            try {
                setLoading(true);
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
                    setSearchId('');
                }
            } catch (error) {
                console.error("Error searching user:", error.response || error.message);
            } finally {
                setLoading(false);
            }
        }
    };

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
                if (convo.type === 'group') return null;
                
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
            
            users.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            
            localStorage.setItem("savedUsers", JSON.stringify(users));
            setSavedUsers(users);
        } catch (err) {
            console.error("Lỗi khi lấy danh sách hội thoại:", err);
            const storedUsers = JSON.parse(localStorage.getItem("savedUsers")) || [];
            setSavedUsers(storedUsers);
        } finally {
            setLoading(false);
        }
    }, [token, userId]);

    const saveUserToLocalStorage = (userData) => {
        let storedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
        const existingUserIndex = storedUsers.findIndex(user => user._id === userData._id);
        
        if (existingUserIndex >= 0) {
            storedUsers[existingUserIndex] = {...storedUsers[existingUserIndex], ...userData};
        } else {
            storedUsers.push(userData);
        }
        
        localStorage.setItem('savedUsers', JSON.stringify(storedUsers));
        setSavedUsers(storedUsers);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua';
        }
        
        return date.toLocaleDateString();
    };

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

    const removeUserFromLocalStorage = (userId) => {
        let storedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
        storedUsers = storedUsers.filter((user) => user._id !== userId);
        localStorage.setItem('savedUsers', JSON.stringify(storedUsers));
        setSavedUsers(storedUsers);
    };

    return (
        <Box width="360px" bgcolor="white" display="flex" flexDirection="column" borderRight="1px solid #e5e5e5">
            <Box p={2} bgcolor="#f5f5f5" display="flex" alignItems="center">
                <TextField
                    fullWidth
                    placeholder={tabValue === 0 ? "Nhập email để tìm..." : "Tìm nhóm..."}
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
                {tabValue === 1 && (
                    <Box display="flex">
                        <Tooltip title="Create new group">
                            <IconButton 
                                color="primary" 
                                sx={{ ml: 1 }}
                                onClick={() => setCreateGroupOpen(true)}
                            >
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Join group with invite link">
                            <IconButton 
                                color="secondary" 
                                sx={{ ml: 0.5 }}
                                onClick={() => setJoinGroupOpen(true)}
                            >
                                <LinkIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth" 
                indicatorColor="primary"
                textColor="primary"
            >
                <Tab label="Chats" />
                <Tab label="Groups" />
            </Tabs>

            <Box flex={1} overflow="auto">
                {tabValue === 0 ? (
                    <List disablePadding>
                        {savedUsers.length > 0 ? (
                            savedUsers.map((userItem) => (
                                <div key={userItem._id}>
                                    <ListItem
                                        button
                                        alignItems="flex-start"
                                        selected={selectedFriend?._id === userItem._id && !selectedFriend?.isGroup}
                                        onClick={() => setSelectedFriend({...userItem, isGroup: false})}
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
                ) : (
                    <List disablePadding>
                        {groups.length > 0 ? (
                            groups.map((group) => (
                                <div key={group._id}>
                                    <ListItem
                                        button
                                        alignItems="flex-start"
                                        selected={selectedFriend?.groupId === group._id}
                                        onClick={() => handleSelectGroup(group)}
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
                                            <Avatar src={group.avatar || ''} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography fontWeight={group.unreadCount > 0 ? 'bold' : 'normal'}>
                                                        {group.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatTime(group.lastMessageTime)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography 
                                                        variant="body2"
                                                        color={group.unreadCount > 0 ? 'primary' : 'textSecondary'}
                                                        fontWeight={group.unreadCount > 0 ? 'bold' : 'normal'}
                                                        noWrap
                                                        sx={{ maxWidth: '200px' }}
                                                    >
                                                        {group.lastMessage || 'No messages yet'}
                                                    </Typography>
                                                    {group.unreadCount > 0 && (
                                                        <Badge 
                                                            badgeContent={group.unreadCount} 
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
                                {groupsLoading ? 'Loading groups...' : 'No groups found. Create a new group to get started.'}
                            </Typography>
                        )}
                    </List>
                )}
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

            <CreateGroupDialog 
                open={createGroupOpen}
                onClose={handleCreateGroup}
            />
            
            <JoinGroupDialog
                open={joinGroupOpen}
                onClose={() => setJoinGroupOpen(false)}
                onSuccess={handleJoinGroup}
            />
        </Box>
    );
};

export default ChatList;
