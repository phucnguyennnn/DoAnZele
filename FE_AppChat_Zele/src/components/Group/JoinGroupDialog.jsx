import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Avatar
} from '@mui/material';
import { Link as LinkIcon, Group as GroupIcon } from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';

const JoinGroupDialog = ({ open, onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupPreview, setGroupPreview] = useState(null);
  const [step, setStep] = useState('input'); // 'input', 'preview', 'success'
  
  const token = localStorage.getItem('accessToken');
  
  // Extract invite code from URL if present
  useEffect(() => {
    if (open) {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('inviteCode');
      
      if (code) {
        setInviteCode(code);
        validateInviteCode(code);
      }
    }
  }, [open]);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setInviteCode('');
      setError('');
      setGroupPreview(null);
      setStep('input');
    }
  }, [open]);
  
  // Extract invite code from full URL
  const extractInviteCode = (url) => {
    try {
      // Handle different formats of links
      if (url.includes('/join/')) {
        return url.split('/join/')[1].split('?')[0];
      }
      
      if (url.includes('inviteCode=')) {
        return new URL(url).searchParams.get('inviteCode');
      }
      
      // If it's just the code itself
      if (url.match(/^[a-zA-Z0-9]{6,}$/)) {
        return url;
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting invite code:', error);
      return '';
    }
  };
  
  // Validate invite code and get group preview
  const validateInviteCode = async (codeToValidate) => {
    const code = extractInviteCode(codeToValidate || inviteCode);
    
    if (!code) {
      setError('Invalid invite code or link');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // This is a mock request - we'll validate when actually joining
      // In a real implementation, you might want to have a separate endpoint to validate
      
      // Simulate preview data
      setGroupPreview({
        _id: 'preview',
        name: 'Loading group details...',
        description: 'Checking invite code...',
        membersCount: 0,
        avatar: '',
        inviteCode: code
      });
      
      setStep('preview');
    } catch (error) {
      console.error('Error validating invite code:', error);
      setError(error.response?.data?.message || 'Failed to validate invite code');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Join group with invite code
  const joinGroup = async () => {
    const code = groupPreview?.inviteCode || extractInviteCode(inviteCode);
    
    if (!code) {
      setError('Invalid invite code');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await axios.get(
        `http://localhost:5000/api/group/join/${code}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        setGroupPreview(response.data.data.group);
        setStep('success');
        
        // Notify parent component
        if (onSuccess) {
          onSuccess(response.data.data.group);
        }
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setError(error.response?.data?.message || 'Failed to join group');
      setStep('input'); // Go back to input step
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'input') {
      validateInviteCode();
    } else if (step === 'preview') {
      joinGroup();
    } else {
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {step === 'input' && 'Join a Group'}
        {step === 'preview' && 'Preview Group'}
        {step === 'success' && 'Successfully Joined'}
      </DialogTitle>
      
      <DialogContent>
        {step === 'input' && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Paste invite link or code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                startAdornment: <LinkIcon sx={{ mr: 1 }} color="action" />,
              }}
              placeholder="https://example.com/join/abc123 or abc123"
              error={!!error}
              helperText={error}
            />
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Enter the invite link or code you received to join a group.
            </Typography>
          </Box>
        )}
        
        {step === 'preview' && groupPreview && (
          <Box sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                src={groupPreview.avatar}
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
              >
                {!groupPreview.avatar && <GroupIcon fontSize="large" />}
              </Avatar>
              
              <Typography variant="h6">{groupPreview.name}</Typography>
              
              {groupPreview.description && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {groupPreview.description}
                </Typography>
              )}
              
              <Typography variant="body2" sx={{ mt: 2 }}>
                {groupPreview.membersCount || 'Unknown'} members
              </Typography>
            </Paper>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              You are about to join this group. Continue?
            </Alert>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}
        
        {step === 'success' && groupPreview && (
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              You have successfully joined the group!
            </Alert>
            
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Avatar
                src={groupPreview.avatar}
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
              >
                {!groupPreview.avatar && <GroupIcon fontSize="large" />}
              </Avatar>
              
              <Typography variant="h6">{groupPreview.name}</Typography>
              
              {groupPreview.description && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {groupPreview.description}
                </Typography>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={onClose}
                  fullWidth
                >
                  Start Chatting
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {step !== 'success' && (
          <Button onClick={onClose}>Cancel</Button>
        )}
        
        {step === 'input' && (
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            disabled={!inviteCode.trim() || isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Continue'}
          </Button>
        )}
        
        {step === 'preview' && (
          <Button 
            onClick={joinGroup}
            variant="contained" 
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Join Group'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default JoinGroupDialog;
