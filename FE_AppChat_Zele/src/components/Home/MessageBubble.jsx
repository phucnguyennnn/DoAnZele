import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const MessageBubble = ({ sender, content, time, userId }) => {
  const isMe = sender === userId;

  return (
    <Box
      display="flex"
      justifyContent={isMe ? 'flex-end' : 'flex-start'}
      mb={2}
    >
      {!isMe && (
        <Avatar 
          src={`https://i.pravatar.cc/150?u=${sender}`} 
          sx={{ mr: 1, alignSelf: 'flex-end' }}
        />
      )}
      <Box
        sx={{
          position: 'relative',
          bgcolor: isMe ? '#0084ff' : '#ffffff',
          color: isMe ? '#ffffff' : '#000000',
          px: 2,
          py: 1,
          borderRadius: 2,
          maxWidth: '70%',
          boxShadow: 1,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            [isMe ? 'right' : 'left']: -8,
            border: '8px solid transparent',
            borderTopColor: isMe ? '#0084ff' : '#ffffff',
            borderBottom: 'none',
            [isMe ? 'borderLeft' : 'borderRight']: 'none',
          }
        }}
      >
        <Typography>{content}</Typography>
        <Typography 
          variant="caption" 
          display="block" 
          textAlign="right"
          color={isMe ? 'rgba(255,255,255,0.7)' : 'textSecondary'}
        >
          {time}
        </Typography>
      </Box>
    </Box>
  );
};

export default MessageBubble;
