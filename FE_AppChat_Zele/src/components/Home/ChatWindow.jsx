import React, { useState, useEffect } from 'react';
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
import axios from 'axios'; // Để gọi API để lấy tin nhắn
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatWindow = ({ selectedFriend, setSelectedFriend }) => {
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const token = localStorage.getItem('accessToken'); // Lấy token từ localStorage
    const rawUser  = localStorage.getItem('user');
    const user = JSON.parse(rawUser); // Chuyển đổi chuỗi JSON thành đối tượng
    const userId = user?._id; // Lấy riêng _id

    useEffect(() => {
        if (selectedFriend) {
            // Lấy cuộc trò chuyện của người bạn được chọn
            const fetchConversationId = async () => {
                try {
                    const res = await axios.get('http://localhost:5000/api/conversation/getAll', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
            

                    // Tìm cuộc trò chuyện có chứa cả người dùng hiện tại và người bạn được chọn
                    const foundConversation = res.data.data.find(convo => {
                        const participantIds = convo.participants.map(p => p.user_id);
                        return (
                            participantIds.includes(userId) &&
                            participantIds.includes(selectedFriend._id)
                        );
                    });

                    if (foundConversation) {
                        setConversationId(foundConversation._id);
                    } else {
                        setConversationId(null);
                        console.warn("Không tìm thấy cuộc trò chuyện với người này.");
                    }
                } catch (err) {
                    console.error("Lỗi khi lấy conversation:", err);
                }
            };

            fetchConversationId();
        }
    }, [selectedFriend, token, userId]);

   useEffect(() => {
    if (conversationId) {
            // Lấy tin nhắn của cuộc trò chuyện khi có conversationId
            const fetchMessages = async () => {
                try {
                    const res = await axios.get(`http://localhost:5000/api/message/getByConversation/${conversationId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    // Lưu mảng dữ liệu tin nhắn vào state
                    setMessages(res.data.data); // Chỉ gán data vào state
                    console.log("Tin nhắn:", res.data.data); // Kiểm tra dữ liệu tin nhắn đã lấy
                    console.log("Conversation ID:", conversationId);
                } catch (error) {
                    console.error("Lỗi khi lấy tin nhắn", error);
                }
            };
            fetchMessages();
        }
    }, [conversationId, token]);

    // Quay lại danh sách bạn bè khi nhấn nút "Back"
    const handleBackClick = () => {
        setSelectedFriend(null); // Trở lại danh sách bạn bè
    };

    return (
        <Box flex={1} display="flex" flexDirection="column">
            <Box 
                p={1.5} 
                bgcolor="white" 
                display="flex" 
                alignItems="center" 
                borderBottom="1px solid #e5e5e5"
            >
                <IconButton sx={{ display: { sm: 'none' }, mr: 1 }} onClick={handleBackClick}>
                    <ArrowBackIcon />
                </IconButton>
                <Avatar src={selectedFriend.avatar} sx={{ mr: 2 }} />
                <Box flex={1}>
                    <Typography fontWeight="bold">{selectedFriend.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                        {selectedFriend.online ? 'Online' : 'Offline'}
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
                {messages.length > 0 ? (
                    messages.map((message) => {
                        console.log("Rendering message: ", message); // Kiểm tra dữ liệu
                        return (
                            <MessageBubble 
                                // key={message._id}
                                // sender={message.sender_id.name}
                                // content={message.content}
                                // time={new Date(message.timestamp).toLocaleTimeString()}
                                // userId={userId}
                                key={message._id}
                                sender={message.sender_id._id}  // <-- chính xác hơn
                                content={message.content}
                                time={new Date(message.timestamp).toLocaleTimeString()}
                                userId={userId}
                            />
                        );
                    })
                ) : (
                    <Typography variant="body2" color="textSecondary">
                        Chưa có tin nhắn nào.
                    </Typography>
)}

            </Box>

            
            {/* Component gửi tin nhắn */}
            <MessageInput selectedFriend={selectedFriend} token={token} conversationId={conversationId} />
        </Box>
    );
};

export default ChatWindow;
