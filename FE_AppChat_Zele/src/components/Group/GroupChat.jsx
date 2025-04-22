import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  MoreVert,
  Delete,
  ContentCopy,
} from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';
import MessageInput from '../Messages/MessageInput';
import GroupChatHeader from './GroupChatHeader';

const GroupChat = ({ group, onLeaveGroup }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('accessToken');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (group?.conversationId) {
      loadMessages();
      
      // Connect to socket.io and listen for messages
      socket.on('receiveGroupMessage', (data) => {
        if (data.conversationId === group.conversationId) {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
        }
      });

      socket.on('messageRevoked', (data) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, is_revoked: true } 
              : msg
          )
        );
      });

      // Clean up on unmount
      return () => {
        socket.off('receiveGroupMessage');
        socket.off('messageRevoked');
      };
    }
  }, [group?.conversationId]);

  const loadMessages = async () => {
    if (!group?.conversationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `http://localhost:5000/api/message/conversation/${group.conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        setMessages(response.data.data);
        scrollToBottom(true);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content, attachments) => {
    if (!group?.conversationId || (!content.trim() && !attachments?.length)) return;
    
    try {
      const formData = new FormData();
      formData.append('message_type', 'text');
      formData.append('content', content);
      
      if (attachments && attachments.length > 0) {
        formData.append('file', attachments[0]);
        if (attachments[0].type.startsWith('image/')) {
          formData.append('message_type', 'image');
        } else if (attachments[0].type.startsWith('video/')) {
          formData.append('message_type', 'video');
        } else if (attachments[0].type.includes('audio')) {
          formData.append('message_type', 'voice');
        } else {
          formData.append('message_type', 'file');
        }
      }
      
      const response = await axios.post(
        `http://localhost:5000/api/message/group/${group.conversationId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data && response.data.status === 'success') {
        // Message will be added via socket event
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleMessageMenu = (event, message) => {
    setSelectedMessage(message);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleRevokeMessage = async () => {
    if (!selectedMessage) return;
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/message/${selectedMessage._id}/revoke`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        // Update will come through socket
      }
    } catch (error) {
      console.error('Error revoking message:', error);
      alert('Failed to revoke message. Please try again.');
    } finally {
      handleMenuClose();
    }
  };

  const handleCopyMessage = () => {
    if (selectedMessage && selectedMessage.content) {
      navigator.clipboard.writeText(selectedMessage.content)
        .then(() => {
          console.log('Text copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    }
    handleMenuClose();
  };

  const scrollToBottom = (instant = false) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: instant ? 'auto' : 'smooth' 
        });
      }
    }, 100);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const isNewDay = (index, messages) => {
    if (index === 0) return true;
    
    const currentDate = new Date(messages[index].createdAt || messages[index].timestamp).toDateString();
    const prevDate = new Date(messages[index-1].createdAt || messages[index-1].timestamp).toDateString();
    
    return currentDate !== prevDate;
  };

  // Check if user can send messages based on group settings
  const canSendMessages = () => {
    if (!group || !currentUser) return false;
    
    const userRole = group.members.find(m => 
      (m.user._id ? m.user._id === currentUser._id : m.user === currentUser._id)
    )?.role;
    
    if (!userRole) return false;
    
    const sendMessagesSetting = group.settings?.who_can_send_messages || 'all';
    
    if (sendMessagesSetting === 'all') return true;
    if (sendMessagesSetting === 'admins_moderators' && ['admin', 'moderator'].includes(userRole)) return true;
    if (sendMessagesSetting === 'admins' && userRole === 'admin') return true;
    
    return false;
  };

  const getMessageSender = (message) => {
    if (!message?.sender_id) return 'Unknown';
    
    // Handle both populated and unpopulated sender objects
    if (typeof message.sender_id === 'object') {
      return message.sender_id.name || 'Unknown';
    }
    
    // Try to find sender in group members
    const sender = group.members.find(m => 
      (m.user._id ? m.user._id === message.sender_id : m.user === message.sender_id)
    );
    
    return sender?.user?.name || 'Unknown';
  };

  const getSenderAvatar = (message) => {
    if (!message?.sender_id) return '';
    
    // Handle both populated and unpopulated sender objects
    if (typeof message.sender_id === 'object') {
      return message.sender_id.primary_avatar || '';
    }
    
    // Try to find sender in group members
    const sender = group.members.find(m => 
      (m.user._id ? m.user._id === message.sender_id : m.user === message.sender_id)
    );
    
    return sender?.user?.primary_avatar || '';
  };

  const isCurrentUser = (message) => {
    if (!message?.sender_id || !currentUser) return false;
    
    const senderId = typeof message.sender_id === 'object' 
      ? message.sender_id._id 
      : message.sender_id;
    
    return senderId === currentUser._id;
  };

  if (!group) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="h6" color="textSecondary">
          Select a group to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <GroupChatHeader 
        group={group} 
        onUpdate={loadMessages} 
        onLeaveGroup={onLeaveGroup} 
      />
      
      <Box 
        flex={1} 
        p={2} 
        sx={{ 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box textAlign="center" my={4}>
            <Typography color="error">{error}</Typography>
            <Button variant="outlined" onClick={loadMessages} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDate = isNewDay(index, messages);
              const isCurrentUserMessage = isCurrentUser(message);
              const senderName = getMessageSender(message);
              const senderAvatar = getSenderAvatar(message);
              
              return (
                <React.Fragment key={message._id}>
                  {showDate && (
                    <Box 
                      display="flex" 
                      justifyContent="center" 
                      my={2}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          backgroundColor: 'rgba(0,0,0,0.1)', 
                          px: 2, 
                          py: 0.5, 
                          borderRadius: 10 
                        }}
                      >
                        {formatDate(message.createdAt || message.timestamp)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box 
                    alignSelf={isCurrentUserMessage ? 'flex-end' : 'flex-start'} 
                    mb={1}
                    sx={{ maxWidth: '70%' }}
                  >
                    {!isCurrentUserMessage && (
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Avatar 
                          src={senderAvatar} 
                          sx={{ width: 24, height: 24, mr: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {senderName}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box display="flex" alignItems="flex-end">
                      <Paper 
                        elevation={1}
                        sx={{
                          p: 1.5,
                          backgroundColor: isCurrentUserMessage ? 'primary.light' : 'background.paper',
                          borderRadius: 2,
                          position: 'relative'
                        }}
                      >
                        {message.is_revoked ? (
                          <Typography variant="body2" color="textSecondary" fontStyle="italic">
                            Message has been revoked
                          </Typography>
                        ) : message.message_type === 'image' ? (
                          <Box>
                            <img 
                              src={message.file_meta?.url || message.content} 
                              alt="Image" 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: 300, 
                                borderRadius: 4 
                              }} 
                            />
                            {message.content && message.content !== message.file_meta?.url && (
                              <Typography variant="body2" mt={1}>
                                {message.content}
                              </Typography>
                            )}
                          </Box>
                        ) : message.message_type === 'file' ? (
                          <Box>
                            <a 
                              href={message.file_meta?.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                textDecoration: 'none',
                                color: 'inherit'
                              }}
                            >
                              <Box 
                                component="span" 
                                sx={{ 
                                  bgcolor: 'primary.main', 
                                  color: 'white',
                                  p: 1,
                                  borderRadius: 1,
                                  mr: 1
                                }}
                              >
                                File
                              </Box>
                              <Typography variant="body2">
                                {message.file_meta?.name || 'Download File'}
                              </Typography>
                            </a>
                            {message.content && (
                              <Typography variant="body2" mt={1}>
                                {message.content}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2">{message.content}</Typography>
                        )}
                        
                        <Typography 
                          variant="caption" 
                          color="textSecondary"
                          sx={{ 
                            display: 'block', 
                            mt: 0.5, 
                            textAlign: 'right',
                            fontSize: '0.7rem'
                          }}
                        >
                          {formatTime(message.createdAt || message.timestamp)}
                        </Typography>
                      </Paper>
                      
                      {isCurrentUserMessage && (
                        <IconButton 
                          size="small" 
                          sx={{ ml: 0.5 }}
                          onClick={(e) => handleMessageMenu(e, message)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
      
      <Divider />
      
      <MessageInput 
        onSend={handleSendMessage} 
        disabled={!canSendMessages()}
        disabledMessage={!canSendMessages() ? "You don't have permission to send messages in this group" : ""}
      />
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRevokeMessage}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Revoke</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default GroupChat;
