import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ onSend, disabled = false, disabledMessage = '' }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (disabled) return;
    
    if ((message.trim() || attachments.length > 0) && !sending) {
      setSending(true);
      await onSend(message, attachments);
      setMessage('');
      setAttachments([]);
      setAttachmentPreview(null);
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAttachments([file]);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachmentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const removeAttachment = () => {
    setAttachments([]);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (disabled) {
    return (
      <Box p={2} bgcolor="#f5f5f5" textAlign="center">
        <Typography variant="body2" color="textSecondary">
          {disabledMessage || "You cannot send messages at this time"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box position="relative">
      {showEmojiPicker && (
        <Box position="absolute" bottom="100%" right={0} zIndex={1000}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </Box>
      )}
      
      {attachmentPreview && (
        <Box 
          p={1} 
          bgcolor="#f5f5f5" 
          display="flex" 
          alignItems="center"
          justifyContent="space-between"
        >
          <Box display="flex" alignItems="center">
            {attachmentPreview.startsWith('data:image') ? (
              <img 
                src={attachmentPreview} 
                alt="Preview" 
                style={{ height: 40, width: 'auto', marginRight: 8, borderRadius: 4 }}
              />
            ) : (
              <Box 
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
            )}
            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
              {attachments[0]?.name}
            </Typography>
          </Box>
          <IconButton size="small" onClick={removeAttachment}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      <Box
        display="flex"
        alignItems="center"
        p={1}
        bgcolor="background.paper"
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        
        <Tooltip title="Attach file">
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Emoji">
          <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <EmojiIcon />
          </IconButton>
        </Tooltip>
        
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          variant="outlined"
          size="small"
          sx={{ mx: 1 }}
        />
        
        <Tooltip title="Send">
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={sending || (!message.trim() && attachments.length === 0)}
          >
            {sending ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default MessageInput;
