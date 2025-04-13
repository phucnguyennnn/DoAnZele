import React from 'react';
import { Box, Typography } from '@mui/material';

const MessageBubble = ({ sender, content, time }) => (
    <Box 
        display="flex" 
        justifyContent={sender === 'me' ? 'flex-end' : 'flex-start'}
        mb={2}
    >
        <Box
            maxWidth="70%"
            bgcolor={sender === 'me' ? '#0084ff' : 'white'}
            color={sender === 'me' ? 'white' : 'black'}
            p={1.5}
            borderRadius="18px"
            boxShadow="0 1px 1px rgba(0,0,0,0.1)"
        >
            <Typography>{content}</Typography>
            <Typography 
                variant="caption" 
                display="block" 
                textAlign="right"
                color={sender === 'me' ? 'rgba(255,255,255,0.7)' : 'textSecondary'}
            >
                {time}
            </Typography>
        </Box>
    </Box>
);

export default MessageBubble;