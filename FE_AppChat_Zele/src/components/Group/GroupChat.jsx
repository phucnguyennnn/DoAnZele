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
import MessageInput from '../../components/Home/MessageInput';
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
      
      console.log('GroupChat: Setting up socket listeners for conversation:', group.conversationId);
      
      // Join the conversation room
      socket.emit('joinConversation', group.conversationId);
      
      // Handlers for socket events
      const handleGroupMessage = (data) => {
        console.log('GroupChat: Received group message:', data);
        
        // Make sure we have the actual message object
        let message = data.message || data;
        
        // Check if this message is for our conversation
        if (!message.conversation_id && !message.conversationId) {
          console.warn('GroupChat: Message without conversation ID received');
          return;
        }
        
        const msgConvoId = message.conversation_id || message.conversationId;
        
        if (msgConvoId === group.conversationId) {
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(m => m._id === message._id);
            if (exists) return prev;
            
            const newMessages = [...prev, message];
            return newMessages;
          });
          
          scrollToBottom();
        }
      };
      
      // Listen for both event types
      socket.on('receiveGroupMessage', handleGroupMessage);
      socket.on('receiveMessage', handleGroupMessage);
      
      socket.on('messageRevoked', (data) => {
        console.log('GroupChat: Message revoked:', data);
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, is_revoked: true } 
              : msg
          )
        );
      });
      
      // Clean up function
      return () => {
        console.log('GroupChat: Cleaning up socket listeners');
        socket.off('receiveGroupMessage');
        socket.off('receiveMessage');
        socket.off('messageRevoked');
        socket.emit('leaveConversation', group.conversationId);
      };
    }
  }, [group?.conversationId]);

  const loadMessages = async () => {
    if (!group?.conversationId) {
      console.error('GroupChat: Cannot load messages - Missing conversation ID');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('GroupChat: Loading messages for conversation:', group.conversationId);
      
      const response = await axios.get(
        `http://localhost:5000/api/message/getByConversation/${group.conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        console.log('GroupChat: Loaded messages:', response.data.data.length);
        setMessages(response.data.data);
        scrollToBottom(true);
      } else {
        console.warn('GroupChat: Unexpected response format while loading messages:', response.data);
      }
    } catch (error) {
      console.error('GroupChat: Error loading messages:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content, attachments) => {
    if (!group?.conversationId || (!content && (!attachments || !attachments.length))) {
      console.error('Cannot send message: Missing conversation ID or content/attachments');
      return;
    }
    
    try {
      console.log('GroupChat: Sending message to conversation:', group.conversationId);
      console.log('GroupChat: Message content:', content);
      console.log('GroupChat: Has attachments:', !!attachments?.length);
      
      const formData = new FormData();
      
      // Add required fields
      formData.append('content', content);
      
      // Handle file attachments
      let messageType = 'text';
      if (attachments && attachments.length > 0) {
        const file = attachments[0];
        formData.append('file', file);
        
        if (file.type.startsWith('image/')) {
          messageType = 'image';
        } else if (file.type.startsWith('video/')) {
          messageType = 'video';
        } else if (file.type.includes('audio')) {
          messageType = 'voice';
        } else {
          messageType = 'file';
        }
      }
      
      formData.append('message_type', messageType);
      
      // Make the API call - use the right endpoint for the BE
      const response = await axios.post(
        `http://localhost:5000/api/message/send/group/${group.conversationId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data && response.data.status === 'success') {
        console.log('GroupChat: Message sent successfully:', response.data);
        
        // Optionally add the message immediately for better UX
        const newMessage = response.data.data;
        if (newMessage) {
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        }
      } else {
        console.warn('GroupChat: Unexpected response format:', response.data);
      }
    } catch (error) {
      console.error('GroupChat: Error sending message:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      
      throw error; // Let MessageInput handle the error
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
      handleMenuClose();
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isNewDay = (index, messages) => {
    if (index === 0) return true;
    
    const currentDate = new Date(messages[index].createdAt || messages[index].timestamp).toDateString();
    const prevDate = new Date(messages[index-1].createdAt || messages[index-1].timestamp).toDateString();
    
    return currentDate !== prevDate;
  };

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

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
      }, 100);
    }
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
                      my={2}
                      display="flex" 
                      justifyContent="center" 
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
                            textAlign: 'right',
                            mt: 0.5, 
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
