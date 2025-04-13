import React from 'react';
import {
    Box,
    Typography,
    Avatar,
    IconButton
} from '@mui/material';
import {
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const friends = [
    { name: 'Nguyễn Văn A', lastMessage: 'Hello bạn!', time: '10:30 AM', unread: 2, avatar: 'https://i.pravatar.cc/150?img=1', online: true },
    { name: 'Trần Thị B', lastMessage: 'Lúc nào rảnh call nhé!', time: '9:15 AM', unread: 0, avatar: 'https://i.pravatar.cc/150?img=2', online: false },        
    { name: 'Lê Văn C', lastMessage: 'Ok, mai gặp!', time: 'Yesterday', unread: 5, avatar: 'https://i.pravatar.cc/150?img=3', online: true },
    { name: 'Phạm Thị D', lastMessage: 'Tài liệu đã gửi cho bạn', time: 'Yesterday', unread: 0, avatar: 'https://i.pravatar.cc/150?img=4', online: false },
    { name: 'Hoàng Văn E', lastMessage: 'Cảm ơn bạn nhiều!', time: '7/20/2023', unread: 0, avatar: 'https://i.pravatar.cc/150?img=5', online: true },

];

const messages = [
    { sender: 'me', content: 'Hello bạn, bạn khỏe không?', time: '10:30 AM' },
    { sender: 'friend', content: 'Mình khỏe, cảm ơn bạn! Còn bạn?', time: '10:31 AM' },
    { sender: 'me', content: 'Mình cũng khỏe, đang làm dự án mới', time: '10:32 AM' },
    { sender: 'friend', content: 'Nghe hay quá, chiều nay cafe nói thêm nhé', time: '10:33 AM' },
];

const ChatWindow = ({ selectedFriend, setSelectedFriend }) => (
    <Box flex={1} display="flex" flexDirection="column">
        <Box 
            p={1.5} 
            bgcolor="white" 
            display="flex" 
            alignItems="center" 
            borderBottom="1px solid #e5e5e5"
        >
            <IconButton sx={{ display: { sm: 'none' }, mr: 1 }} onClick={() => setSelectedFriend(null)}>
                <ArrowBackIcon />
            </IconButton>
            <Avatar src={friends[selectedFriend].avatar} sx={{ mr: 2 }} />
            <Box flex={1}>
                <Typography fontWeight="bold">{friends[selectedFriend].name}</Typography>
                <Typography variant="caption" color="textSecondary">
                    {friends[selectedFriend].online ? 'Online' : 'Offline'}
                </Typography>
            </Box>
            <IconButton>
                <SearchIcon />
            </IconButton>
            <IconButton>
                <MoreVertIcon />
            </IconButton>
        </Box>
        
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
            {messages.map((message, index) => (
                <MessageBubble 
                    key={index}
                    sender={message.sender}
                    content={message.content}
                    time={message.time}
                />
            ))}
        </Box>
        
        <MessageInput />
    </Box>
);

export default ChatWindow;