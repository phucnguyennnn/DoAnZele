import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Add, Close, PhotoCamera } from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';

const CreateGroupDialog = ({ open, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const token = localStorage.getItem('accessToken');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Handle avatar selection
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Search for users to add to the group
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      
      // First try to search by email/phone
      try {
        const directResponse = await axios.get(
          `http://localhost:5000/api/user/getUser?email=${searchQuery.trim()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (directResponse.data && directResponse.data.data) {
          const foundUser = directResponse.data.data;
          
          // Check if user is current user or already selected
          if (foundUser._id === currentUser._id) {
            console.log("Cannot add yourself to the group");
            return;
          }
          
          if (selectedMembers.some(member => member._id === foundUser._id)) {
            console.log("User already selected");
            return;
          }
          
          setSearchResults([foundUser]);
          return; // Exit if found by email/phone
        }
      } catch (error) {
        // If direct search fails, continue to general search
        console.log("Not found by email/phone, trying general search");
      }
      
      // Fall back to general search
      const res = await axios.get(
        `http://localhost:5000/api/user/search?query=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && res.data.data) {
        // Filter out current user and already selected members
        const filteredResults = res.data.data.filter(
          user => user._id !== currentUser._id && 
                 !selectedMembers.some(member => member._id === user._id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add user to selected members
  const addMember = (user) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchResults(searchResults.filter(u => u._id !== user._id));
    setSearchQuery('');
  };

  // Remove user from selected members
  const removeMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(member => member._id !== userId));
  };

  // Create the group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Group name is required');
      return;
    }

    try {
      setCreateLoading(true);
      
      const formData = new FormData();
      formData.append('name', groupName);
      formData.append('description', groupDescription);
      selectedMembers.forEach(member => {
        formData.append('members', member._id);
      });
      
      if (avatar) {
        formData.append('avatar', avatar);
      }

      const response = await axios.post(
        'http://localhost:5000/api/group/create',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data && response.data.status === 'success') {
        onClose(response.data.data);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Reset form when dialog closes
  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMembers([]);
    setAvatar(null);
    setAvatarPreview('');
    onClose();
  };

  // Handle Enter key for search
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const delaySearch = setTimeout(() => {
        handleSearch();
      }, 500);
      
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Group</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          {/* Group Avatar */}
          <Box display="flex" justifyContent="center" mb={2}>
            <Box position="relative">
              <Avatar
                src={avatarPreview}
                sx={{ width: 100, height: 100 }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
                component="label"
                size="small"
              >
                <PhotoCamera fontSize="small" sx={{ color: 'white' }} />
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleAvatarChange}
                />
              </IconButton>
            </Box>
          </Box>

          {/* Group Name and Description */}
          <TextField
            label="Group Name"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <TextField
            label="Group Description"
            fullWidth
            multiline
            rows={2}
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
          />

          {/* Selected Members */}
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Selected Members ({selectedMembers.length})
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedMembers.map(member => (
                <Chip
                  key={member._id}
                  avatar={<Avatar src={member.primary_avatar} />}
                  label={member.name}
                  onDelete={() => removeMember(member._id)}
                />
              ))}
            </Box>
          </Box>

          {/* Search for members */}
          <Box mt={2}>
            <TextField
              label="Search by phone number or email"
              placeholder="Enter phone number or email to add users"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              InputProps={{
                endAdornment: loading ? <CircularProgress size={20} /> : null,
              }}
            />
          </Box>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <List sx={{ maxHeight: 200, overflow: 'auto' }}>
              {searchResults.map(user => (
                <ListItem
                  key={user._id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => addMember(user)}>
                      <Add />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={user.primary_avatar} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={user.email || user.phone}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleCreateGroup} 
          color="primary" 
          disabled={!groupName.trim() || createLoading}
        >
          {createLoading ? <CircularProgress size={24} /> : "Create Group"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupDialog;
