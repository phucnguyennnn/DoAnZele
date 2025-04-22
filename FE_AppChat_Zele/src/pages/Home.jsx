import React from 'react';
import ChatList from '../components/Home/ChatList';
import SidebarIcons from '../components/Home/SidebarIcons';
import ChatWindow from '../components/Home/ChatWindow';
import WelcomeScreen from '../components/Home/WelcomeScreen';

import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

const Home = () => {
    const [selectedFriend, setSelectedFriend] = React.useState(null);
const handleLogout = () => {

    const isConfirmed = window.confirm('Bạn có chắc chắn muốn đăng xuất không?');
    if (isConfirmed) {
        // localStorage.removeItem('accessToken');
        // localStorage.removeItem('user');
        localStorage.clear();
        window.location.href = '/';
        // navigate('/');
        console.log('Đăng xuất thành công');
    } else {
        console.log('Hủy đăng xuất');
    }
    };

    return (
        <Box display="flex" height="100vh" bgcolor="#f0f2f5">
            <SidebarIcons onLogout={handleLogout} />
            <ChatList 
                selectedFriend={selectedFriend} 
                setSelectedFriend={setSelectedFriend} 
            />
            
            {selectedFriend === null ? (
                <WelcomeScreen />
            ) : (
                <ChatWindow selectedFriend={selectedFriend} />
            )}
        </Box>
    );
};

export default Home;