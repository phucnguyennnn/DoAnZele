import React from 'react';
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

const friends = [
    { name: 'Nguyễn Văn A', lastMessage: 'Hello bạn!', time: '10:30 AM', unread: 2, avatar: 'https://i.pravatar.cc/150?img=1', online: true },
    { name: 'Trần Thị B', lastMessage: 'Lúc nào rảnh call nhé!', time: '9:15 AM', unread: 0, avatar: 'https://i.pravatar.cc/150?img=2', online: false },
    { name: 'Lê Văn C', lastMessage: 'Ok, mai gặp!', time: 'Yesterday', unread: 5, avatar: 'https://i.pravatar.cc/150?img=3', online: true },
    { name: 'Phạm Thị D', lastMessage: 'Tài liệu đã gửi cho bạn', time: 'Yesterday', unread: 0, avatar: 'https://i.pravatar.cc/150?img=4', online: false },
    { name: 'Hoàng Văn E', lastMessage: 'Cảm ơn bạn nhiều!', time: '7/20/2023', unread: 0, avatar: 'https://i.pravatar.cc/150?img=5', online: true },
];

const ChatList = ({ selectedFriend, setSelectedFriend }) => (
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
                placeholder="Tìm kiếm"
                variant="outlined"
                size="small"
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
                {friends.map((friend, index) => (
                    <React.Fragment key={index}>
                        <ListItem 
                            button 
                            alignItems="flex-start"
                            selected={selectedFriend === index}
                            onClick={() => setSelectedFriend(index)}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: '#e5efff'
                                },
                                '&.Mui-selected:hover': {
                                    backgroundColor: '#e5efff'
                                }
                            }}
                        >
                            <ListItemAvatar>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    variant="dot"
                                    color="success"
                                    invisible={!friend.online}
                                >
                                    <Avatar src={friend.avatar} />
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography fontWeight="bold">{friend.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {friend.time}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography 
                                            variant="body2" 
                                            color="textSecondary"
                                            sx={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '200px'
                                            }}
                                        >
                                            {friend.lastMessage}
                                        </Typography>
                                        {friend.unread > 0 && (
                                            <Box 
                                                bgcolor="#0084ff" 
                                                color="white" 
                                                borderRadius="50%" 
                                                width="20px" 
                                                height="20px" 
                                                display="flex" 
                                                justifyContent="center" 
                                                alignItems="center"
                                                fontSize="0.75rem"
                                            >
                                                {friend.unread}
                                            </Box>
                                        )}
                                    </Box>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                            />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </React.Fragment>
                ))}
            </List>
        </Box>
    </Box>
);

export default ChatList;