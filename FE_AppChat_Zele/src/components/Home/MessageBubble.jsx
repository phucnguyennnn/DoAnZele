import React from 'react';
import { Box, Typography, Avatar, Paper, Link } from '@mui/material';
import { AttachFile as AttachFileIcon } from '@mui/icons-material';

const MessageBubble = ({ 
  sender, 
  content, 
  time, 
  userId, 
  isRead,
  messageType = 'text',
  fileUrl,
  fileName,
  isRevoked = false,
  senderName,
  senderAvatar
}) => {
  const isMe = sender === userId;

  // Sử dụng avatar được truyền vào hoặc tạo một avatar ngẫu nhiên
  const avatarUrl = senderAvatar || `https://i.pravatar.cc/150?u=${sender}`;

  const renderContent = () => {
    if (isRevoked) {
      return (
        <Typography variant="body2" fontStyle="italic" color={isMe ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
          Tin nhắn đã thu hồi
        </Typography>
      );
    }

    switch (messageType) {
      case 'image':
        return (
          <Box>
            <Box 
              component="img" 
              src={fileUrl || content}
              alt="Image message"
              sx={{ 
                maxWidth: '100%', 
                maxHeight: 300, 
                borderRadius: 1,
                display: 'block',
                mb: content && content !== fileUrl ? 1 : 0
              }}
            />
            {content && content !== fileUrl && (
              <Typography variant="body2">{content}</Typography>
            )}
          </Box>
        );
      
      case 'file':
        return (
          <Box>
            <Link 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              underline="none"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: isMe ? 'inherit' : 'primary.main'
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: isMe ? 'rgba(255,255,255,0.2)' : 'primary.main', 
                  color: isMe ? 'white' : 'white',
                  p: 0.8,
                  borderRadius: 1,
                  mr: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AttachFileIcon fontSize="small" />
              </Box>
              <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                {fileName || 'Download file'}
              </Typography>
            </Link>
            {content && (
              <Typography variant="body2" mt={1}>{content}</Typography>
            )}
          </Box>
        );
      
      case 'text':
      default:
        return <Typography variant="body2">{content}</Typography>;
    }
  };

  return (
    <Box sx={{ mb: 1 }}>
      {/* Hiển thị tên người gửi cho tin nhắn từ người khác */}
      {!isMe && senderName && (
        <Typography 
          variant="caption" 
          sx={{ 
            ml: 6, 
            mb: 0.5, 
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.75rem'
          }}
        >
          {senderName}
        </Typography>
      )}
    
      <Box
        display="flex"
        justifyContent={isMe ? 'flex-end' : 'flex-start'}
        alignItems="flex-end"
        mb={0.5}
      >
        {!isMe && (
          <Avatar 
            src={avatarUrl}
            sx={{ 
              mr: 1, 
              width: 36, 
              height: 36,
              border: '1px solid #e0e0e0'
            }}
          />
        )}

        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            bgcolor: isMe ? '#0091ff' : 'white',
            color: isMe ? 'white' : 'black',
            px: 1.5,
            py: 1,
            borderRadius: '16px',
            maxWidth: '70%',
            wordBreak: 'break-word',
            boxShadow: !isMe ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            border: !isMe ? '1px solid #e0e0e0' : 'none',
          }}
        >
          {renderContent()}
          
          <Box 
            display="flex" 
            justifyContent="flex-end" 
            alignItems="center" 
            mt={0.5}
            sx={{ opacity: 0.7 }}
          >
            <Typography 
              variant="caption" 
              fontSize="0.7rem"
              color={isMe ? 'rgba(255,255,255,0.9)' : 'text.secondary'}
              sx={{ mr: isRead !== undefined ? 0.5 : 0 }}
            >
              {time}
            </Typography>
            
            {isMe && isRead !== undefined && (
              <Typography 
                variant="caption" 
                fontSize="0.7rem"
                color={isRead ? 'info.light' : 'rgba(255,255,255,0.7)'}
              >
                {isRead ? ' ✓✓' : ' ✓'}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MessageBubble;
