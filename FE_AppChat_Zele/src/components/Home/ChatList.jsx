import React, { useState } from 'react';
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
    Avatar
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';

const ChatList = ({ selectedFriend, setSelectedFriend }) => {
    const token = localStorage.getItem('accessToken'); // Lấy token từ localStorage
    const [searchId, setSearchId] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

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
                setUser(res.data.data); // Cập nhật kết quả tìm kiếm
            } catch (error) {
                console.error("Không tìm thấy người dùng", error);
                setUser(null); // Xóa kết quả cũ nếu không tìm thấy
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Box
            width="360px"
            bgcolor="white"
            display="flex"
            flexDirection="column"
            borderRight="1px solid #e5e5e5"
        >
            <Box p={2} bgcolor="#f5f5f5">
                <TextField
                    fullWidth
                    placeholder="Nhập ID để tìm..."
                    variant="outlined"
                    size="small"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyDown={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="disabled" />
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
                    {user && (
                        <>
                            <ListItem
                                button
                                alignItems="flex-start"
                                selected={selectedFriend === user._id}
                                onClick={() => setSelectedFriend(user)}
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
                                        invisible={!user.online}
                                    >
                                        <Avatar src={user.avatar || ''} />
                                    </Badge>
                                </ListItemAvatar>

                                <ListItemText
                                    primary={user.name || user.username}
                                    secondary={
                                        <Typography
                                            variant="body2"
                                            color="textSecondary"
                                            noWrap
                                        >
                                            {user.lastMessage || 'Chưa có tin nhắn nào'}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            <Divider variant="inset" component="li" />
                        </>
                    )}
                </List>
            </Box>
        </Box>
    );
};

export default ChatList;
