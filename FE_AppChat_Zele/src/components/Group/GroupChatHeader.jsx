import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  MoreVert,
  Settings,
  ExitToApp,
} from '@mui/icons-material';
import GroupSettings from './GroupSettings';
import axios from 'axios';

const GroupChatHeader = ({ group, onUpdate, onLeaveGroup }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const token = localStorage.getItem('accessToken');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Check if current user is admin or moderator
  const currentMember = group?.members?.find(m => m.user._id === currentUser._id);
  const isAdmin = currentMember?.role === 'admin';
  const isModerator = currentMember?.role === 'moderator';
  
  // Count online members
  const onlineCount = group?.members?.filter(m => m.isOnline)?.length || 0;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenSettings = () => {
    handleMenuClose();
    setSettingsOpen(true);
  };

  const handleLeaveGroup = async () => {
    handleMenuClose();
    
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/group/member/remove',
          {
            groupId: group._id,
            memberId: currentUser._id, // Remove yourself
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data.status === 'success') {
          if (onLeaveGroup) {
            onLeaveGroup(group._id);
          }
        }
      } catch (error) {
        console.error('Error leaving group:', error);
        alert('Failed to leave group. Please try again.');
      }
    }
  };

  const handleGroupUpdate = (updatedGroup) => {
    if (onUpdate) {
      onUpdate(updatedGroup);
    }
    setSettingsOpen(false);
  };

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        px={2}
        py={1}
        borderBottom="1px solid #e0e0e0"
        bgcolor="#f5f5f5"
      >
        <Avatar 
          src={group?.avatar || ''} 
          sx={{ width: 48, height: 48 }}
        />
        <Box ml={2} flex={1}>
          <Typography variant="subtitle1" fontWeight="bold">
            {group?.name || 'Group Chat'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {group?.members?.length || 0} members • {onlineCount} online
          </Typography>
        </Box>
        <Tooltip title="Group options">
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenSettings}>
          <Settings fontSize="small" sx={{ mr: 1 }} />
          Group settings
        </MenuItem>
        <MenuItem onClick={handleLeaveGroup} sx={{ color: 'error.main' }}>
          <ExitToApp fontSize="small" sx={{ mr: 1 }} />
          Leave group
        </MenuItem>
      </Menu>

      {settingsOpen && (
        <GroupSettings
          open={settingsOpen}
          group={group}
          onClose={() => setSettingsOpen(false)}
          onUpdate={handleGroupUpdate}
          onDelete={onLeaveGroup}
        />
      )}
    </>
  );
};

export default GroupChatHeader;
