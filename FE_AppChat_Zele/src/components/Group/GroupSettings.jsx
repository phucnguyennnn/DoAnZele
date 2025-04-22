import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tab,
  Tabs,
  Typography,
  TextField,
  IconButton,
  Avatar,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { PhotoCamera, Save, Delete, Group } from '@mui/icons-material';
import axios from 'axios';
import ManageMembers from './ManageMembers';

const GroupSettings = ({ open, group, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(group?.avatar || '');
  const [whoCanSendMessages, setWhoCanSendMessages] = useState(
    group?.settings?.who_can_send_messages || 'all'
  );
  const [whoCanAddMembers, setWhoCanAddMembers] = useState(
    group?.settings?.who_can_add_members || 'admins_moderators'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const token = localStorage.getItem('accessToken');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  // Check if current user is admin
  const isAdmin = group?.members?.some(
    m => (m.user._id === currentUser._id || m.user === currentUser._id) && m.role === 'admin'
  );
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle avatar change
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  // Save group settings
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      
      // Add settings
      formData.append('settings[who_can_send_messages]', whoCanSendMessages);
      formData.append('settings[who_can_add_members]', whoCanAddMembers);
      
      if (avatar) {
        formData.append('avatar', avatar);
      } else if (avatarPreview) {
        formData.append('avatar', avatarPreview);
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/group/${group._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data && response.data.status === 'success') {
        setSuccess('Group settings updated successfully');
        
        // Update group data in parent component
        if (onUpdate) {
          onUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error updating group settings:', error);
      setError(error.response?.data?.message || 'Failed to update group settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete group
  const handleDeleteGroup = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.delete(
        `http://localhost:5000/api/group/${group._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        // Notify parent component
        if (onDelete) {
          onDelete(group._id);
        }
        
        // Close dialog
        onClose();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setError(error.response?.data?.message || 'Failed to delete group');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Leave group (remove self from group)
  const handleLeaveGroup = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(
        'http://localhost:5000/api/group/member/remove',
        {
          groupId: group._id,
          memberId: currentUser._id // Remove self
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        // Notify parent component
        if (onDelete) {
          onDelete(group._id);
        }
        
        // Close dialog
        onClose();
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      setError(error.response?.data?.message || 'Failed to leave group');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle member role change
  const handleMemberRoleChange = async (memberId, newRole) => {
    try {
      setIsLoading(true);
      
      console.log('Changing role for member:', memberId, 'to', newRole);
      console.log('Group ID:', group._id);
      
      const response = await axios.post(
        'http://localhost:5000/api/group/member/role',
        {
          groupId: group._id,
          memberId: memberId,
          role: newRole
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        setSuccess('Vai trò thành viên đã được cập nhật');
        
        // Update group data
        if (onUpdate) {
          // Update members in the group object
          const updatedGroup = { ...group };
          updatedGroup.members = updatedGroup.members.map(m => {
            const id = typeof m.user === 'object' ? m.user._id : m.user;
            if (id === memberId) {
              return { ...m, role: newRole };
            }
            return m;
          });
          onUpdate(updatedGroup);
        }
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      setError(error.response?.data?.message || 'Lỗi khi cập nhật vai trò thành viên');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle member removal
  const handleRemoveMember = async (memberId) => {
    try {
      setIsLoading(true);
      
      console.log('Removing member:', memberId);
      console.log('Group ID:', group._id);
      
      const response = await axios.post(
        'http://localhost:5000/api/group/member/remove',
        {
          groupId: group._id,
          memberId: memberId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        setSuccess('Thành viên đã được xóa khỏi nhóm');
        
        // Update group data
        if (onUpdate) {
          // Filter out the removed member
          const updatedGroup = { ...group };
          updatedGroup.members = updatedGroup.members.filter(m => {
            const id = typeof m.user === 'object' ? m.user._id : m.user;
            return id !== memberId;
          });
          onUpdate(updatedGroup);
        }
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setError(error.response?.data?.message || 'Lỗi khi xóa thành viên');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Group Settings</DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="General" />
          <Tab label="Members" />
        </Tabs>
      </Box>
      
      <DialogContent>
        {/* General Settings Tab */}
        {activeTab === 0 && (
          <Box>
            {/* Avatar */}
            <Box display="flex" justifyContent="center" my={2}>
              <Box position="relative">
                <Avatar
                  src={avatarPreview}
                  alt={name}
                  sx={{ width: 100, height: 100 }}
                >
                  {!avatarPreview && <Group fontSize="large" />}
                </Avatar>
                
                {isAdmin && (
                  <IconButton
                    aria-label="change avatar"
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                    size="small"
                  >
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleAvatarChange}
                    />
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
            
            {/* Basic Info */}
            <TextField
              fullWidth
              label="Group Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              disabled={!isAdmin}
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              disabled={!isAdmin}
            />
            
            {/* Permissions */}
            {isAdmin && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Permissions
                </Typography>
                
                <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                  <FormLabel component="legend">Who can send messages</FormLabel>
                  <RadioGroup
                    value={whoCanSendMessages}
                    onChange={(e) => setWhoCanSendMessages(e.target.value)}
                  >
                    <FormControlLabel value="all" control={<Radio />} label="Everyone" />
                    <FormControlLabel value="admins_moderators" control={<Radio />} label="Admins & Moderators only" />
                    <FormControlLabel value="admins" control={<Radio />} label="Admins only" />
                  </RadioGroup>
                </FormControl>
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <FormLabel component="legend">Who can add members</FormLabel>
                  <RadioGroup
                    value={whoCanAddMembers}
                    onChange={(e) => setWhoCanAddMembers(e.target.value)}
                  >
                    <FormControlLabel value="all" control={<Radio />} label="Everyone" />
                    <FormControlLabel value="admins_moderators" control={<Radio />} label="Admins & Moderators only" />
                    <FormControlLabel value="admins" control={<Radio />} label="Admins only" />
                  </RadioGroup>
                </FormControl>
              </Box>
            )}
            
            {/* Messages */}
            {success && (
              <Alert severity="success" sx={{ mt: 3 }}>
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}
            
            {/* Save Button */}
            {isAdmin && (
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSave}
                  disabled={isLoading || !name.trim()}
                >
                  Save Changes
                </Button>
              </Box>
            )}
            
            {/* Leave or Delete Group */}
            <Box mt={4}>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom color="error">
                {isAdmin ? 'Delete Group' : 'Leave Group'}
              </Typography>
              
              <Typography variant="body2" gutterBottom color="textSecondary">
                {isAdmin 
                  ? 'Deleting the group will remove all members and conversations. This action cannot be undone.'
                  : 'If you leave the group, you will need to be invited again to rejoin.'
                }
              </Typography>
              
              <Box display="flex" justifyContent="flex-start" mt={2}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={isAdmin ? () => setIsDeleteDialogOpen(true) : handleLeaveGroup}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <Delete />}
                >
                  {isAdmin ? 'Delete Group' : 'Leave Group'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Members Tab */}
        {activeTab === 1 && (
          <ManageMembers 
            group={group} 
            onUpdate={onUpdate}
            onRoleChange={handleMemberRoleChange}
            onRemoveMember={handleRemoveMember}
          />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this group? This action cannot be undone and all conversations will be permanently lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteGroup} 
            color="error"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Delete Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default GroupSettings;
