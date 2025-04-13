import React from 'react';
import { Box, Typography } from '@mui/material';

const WelcomeScreen = () => (
    <Box 
        flex={1} 
        bgcolor="#f0f2f5" 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center"
    >
        <Box textAlign="center" maxWidth="400px">
            <img
                src="https://zalo.zadn.vn/web/assets/img/background-chat.7d3e1e8b.png" 
                alt="Zalo background" 
                style={{ width: '200px', marginBottom: '20px' }}
            />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Chào mừng bạn đến với Zalo Web
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
                Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người thân, bạn bè được tối ưu hóa cho máy tính của bạn.
            </Typography>
        </Box>
    </Box>
);

export default WelcomeScreen;