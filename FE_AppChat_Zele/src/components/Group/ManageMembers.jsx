import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import {
  MoreVert,
  PersonAdd,
  Delete,
  Link as LinkIcon,
  ContentCopy,
  Refresh,
  AdminPanelSettings
} from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';

const ManageMembers = ({ group, onUpdate }) => {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const token = localStorage.getItem('accessToken');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Initialize members list from group prop
  useEffect(() => {
    if (group && group.members) {
      setMembers(group.members);
    }
  }, [group]);

  // Find current user's role in the group
  const currentUserRole = members.find(m => 
    m.user._id === currentUser._id || m.user === currentUser._id
  )?.role || 'member';

  // Check if user can add members
  const canAddMembers = () => {
    if (!group || !group.settings) return false;
    
    const setting = group.settings.who_can_add_members || 'admins_moderators';
    
    if (setting === 'all') return true;
    if (setting === 'admins_moderators' && ['admin', 'moderator'].includes(currentUserRole)) return true;
    if (setting === 'admins' && currentUserRole === 'admin') return true;
    
    return false;
  };

  // Check if user can remove members
  const canRemoveMembers = () => {
    return ['admin', 'moderator'].includes(currentUserRole);
  };

  // Check if user can change roles
  const canChangeRoles = () => {
    return currentUserRole === 'admin';
  };

  // Get the display name for a user
  const getUserName = (user) => {
    if (typeof user === 'object') {
      return user.name || 'Unknown User';
    }
    
    // If just an ID, try to find in members list
    const member = members.find(m => m.user === user || (m.user && m.user._id === user));
    return member?.user?.name || 'Unknown User';
  };

  // Get avatar for a user
  const getUserAvatar = (user) => {
    if (typeof user === 'object') {
      return user.primary_avatar || user.avatar || '';
    }
    
    // If just an ID, try to find in members list
    const member = members.find(m => m.user === user || (m.user && m.user._id === user));
    return member?.user?.primary_avatar || member?.user?.avatar || '';
  };

  // Search for users to add
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await axios.get(
        `http://localhost:5000/api/user/search?query=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        // Filter out users who are already members
        const memberIds = members.map(m => 
          typeof m.user === 'object' ? m.user._id : m.user
        );
        
        const filteredResults = response.data.data.filter(
          user => !memberIds.includes(user._id)
        );
        
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSnackbar({
        open: true,
        message: 'Error searching for users',
        severity: 'error'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add member to group
  const addMember = async (userId) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/group/member/add',
        {
          groupId: group._id,
          memberId: userId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Member added successfully',
          severity: 'success'
        });
        
        // Update local state and notify parent
        const newMembers = [...members, { 
          user: response.data.data.user, 
          role: 'member',
          added_by: currentUser._id,
          added_at: new Date().toISOString()
        }];
        
        setMembers(newMembers);
        setSearchQuery('');
        setSearchResults([]);
        
        if (onUpdate) {
          onUpdate({...group, members: newMembers});
        }
      }
    } catch (error) {
      console.error('Error adding member:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error adding member',
        severity: 'error'
      });
    }
  };

  // Open member options menu
  const handleOpenMenu = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  // Close member options menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  // Handle role change
  const handleRoleChange = async (newRole) => {
    if (!selectedMember) return;

    try {
      setIsGeneratingLink(true); // Sử dụng trạng thái loading

      const memberId = typeof selectedMember.user === 'object' 
        ? selectedMember.user._id 
        : selectedMember.user;

console.log('Changing role for member:', memberId, 'to', newRole);
      console.log('Group ID:', group._id);
      
      const response = await axios.put(
        'http://localhost:5000/api/group/member/role',
        {
          groupId: group._id,
          memberId: memberId,
          role: newRole
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Role change response:', response.data);

      if (response.data && response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: `Role changed to ${newRole} successfully`,
          severity: 'success'
        });

// Update local state
        const updatedMembers = members.map(m => {
          const currentId = typeof m.user === 'object' ? m.user._id : m.user;
          return currentId === memberId ? { ...m, role: newRole } : m;
        });

        setMembers(updatedMembers);
        if (onUpdate) {
          onUpdate({ ...group, members: updatedMembers });
        }
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error changing role',
        severity: 'error'
      });
    } finally {
      setRoleDialogOpen(false);
      handleCloseMenu();
      setIsGeneratingLink(false);
    }
  };

  // Remove member from group
  const handleRemoveMember = async () => {
    if (!selectedMember) {
      setSnackbar({
        open: true,
        message: 'No member selected to remove',
        severity: 'error'
      });
      return;
    }

    try {
      setIsGeneratingLink(true);

      // Extract member ID properly by checking its type
      let memberId;
      if (typeof selectedMember.user === 'object') {
        // If user is an object, get its _id
        memberId = selectedMember.user._id;
      } else {
        // If user is already an ID string
        memberId = selectedMember.user;
      }

      // Validate that we have a valid ID
      if (!memberId) {
        throw new Error('Cannot identify member to remove');
      }

      console.log('Removing member:', memberId, 'from group:', group._id);

      const response = await axios.post(
        'http://localhost:5000/api/group/member/remove',
        {
          groupId: group._id,
          memberId: memberId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Remove member response:', response.data);

      if (response.data && response.data.status === 'success') {
        // Get member name for success message
        const memberName = getUserName(selectedMember.user);
        
        setSnackbar({
          open: true,
          message: `${memberName} has been removed from the group`,
          severity: 'success'
        });

        // Update local state
        const updatedMembers = members.filter(m => {
          const currentId = typeof m.user === 'object' ? m.user._id : m.user;
          return currentId !== memberId;
        });

        setMembers(updatedMembers);

        if (onUpdate) {
          onUpdate({ ...group, members: updatedMembers });
        }
      } else {
        throw new Error(response.data.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error removing member',
        severity: 'error'
      });
    } finally {
      setConfirmDialogOpen(false);
      handleCloseMenu();
      setIsGeneratingLink(false);
    }
  };

  // Get invite link for group
  const getInviteLink = async () => {
    if (!group || !group._id) {
      setSnackbar({
        open: true,
        message: 'Group information is missing',
        severity: 'error'
      });
      return;
    }

    try {
      setIsGeneratingLink(true);
      const response = await axios.get(
        `http://localhost:5000/api/group/${group._id}/invite`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.status === 'success') {
        setInviteLink(response.data.data.invite_link.url);
        setLinkDialogOpen(true);
      } else {
        throw new Error('Failed to fetch invite link');
      }
    } catch (error) {
      console.error('Error getting invite link:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error generating invite link',
        severity: 'error'
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Regenerate invite link
  const regenerateInviteLink = async () => {
    try {
      setIsGeneratingLink(true);
      const response = await axios.post(
        `http://localhost:5000/api/group/${group._id}/regenerate-invite-link`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        setInviteLink(response.data.data.invite_link.url);
        
        setSnackbar({
          open: true,
          message: 'Invite link regenerated successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error regenerating invite link:', error);
      setSnackbar({
        open: true,
        message: 'Error regenerating invite link',
        severity: 'error'
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy invite link to clipboard
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Invite link copied to clipboard',
          severity: 'success'
        });
      })
      .catch(err => {
        console.error('Error copying link:', err);
        setSnackbar({
          open: true,
          message: 'Failed to copy link',
          severity: 'error'
        });
      });
  };

  return (
    <Box>
      {/* Members list */}
      <Typography variant="h6" gutterBottom>
        Members ({members.length})
      </Typography>
      
      <List>
        {members.map((member) => {
          const user = member.user;
          const userId = typeof user === 'object' ? user._id : user;
          const isCurrentUser = userId === currentUser._id;
          const userName = getUserName(user);
          const userAvatar = getUserAvatar(user);
          
          return (
            <ListItem key={userId} divider>
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color="success"
                  invisible={!socket.onlineUsers?.includes(userId)}
                >
                  <Avatar src={userAvatar}>
                    {!userAvatar && userName.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText 
                primary={
                  <Box display="flex" alignItems="center">
                    {userName}
                    {member.role === 'admin' && (
                      <AdminPanelSettings 
                        fontSize="small" 
                        color="primary" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Box>
                }
                secondary={`${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`}
              />
              
              {!isCurrentUser && canRemoveMembers() && (
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={(e) => handleOpenMenu(e, member)}>
                    <MoreVert />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          );
        })}
      </List>

      {/* Member options menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {canChangeRoles() && selectedMember?.role !== 'admin' && (
          <MenuItem onClick={() => {
            setRoleDialogOpen(true);
            handleCloseMenu();
          }}>
            Change Role
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          setConfirmAction('remove');
          setConfirmDialogOpen(true);
          handleCloseMenu();
        }}>
          Remove from group
        </MenuItem>
      </Menu>

      {/* Confirm dialog for removing member */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Xác nhận</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction === 'remove' 
              ? `Bạn có chắc chắn muốn xóa ${selectedMember ? getUserName(selectedMember.user) : ''} khỏi nhóm không?`
              : 'Bạn có chắc chắn muốn thực hiện hành động này?'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={isGeneratingLink}>
            Hủy
          </Button>
          <Button 
            color="error" 
            onClick={handleRemoveMember}
            disabled={isGeneratingLink}
          >
            {isGeneratingLink ? <CircularProgress size={20} /> : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for changing role */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Thay đổi vai trò thành viên</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Chọn vai trò mới cho {selectedMember ? getUserName(selectedMember.user) : ''}:
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <Button 
              variant="contained"
              color="primary"
              onClick={() => handleRoleChange('moderator')}
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? <CircularProgress size={20} /> : 'Quản trị viên'}
            </Button>
            <Button 
              variant="outlined"
              onClick={() => handleRoleChange('member')}
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? <CircularProgress size={20} /> : 'Thành viên'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)} disabled={isGeneratingLink}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Section for adding new members */}
      {canAddMembers() && (
        <Box mt={3}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Add New Members
          </Typography>
          
          <Box display="flex" mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              sx={{ mr: 1 }}
            />
            <Button 
              variant="contained" 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              startIcon={isSearching ? <CircularProgress size={20} /> : <PersonAdd />}
            >
              Search
            </Button>
          </Box>
          
          {searchResults.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 2 }}>
              <List>
                {searchResults.map(user => (
                  <ListItem key={user._id} divider>
                    <ListItemAvatar>
                      <Avatar src={user.primary_avatar || user.avatar}>
                        {user.name ? user.name.charAt(0) : '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={user.email || user.phone}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PersonAdd />}
                      onClick={() => addMember(user._id)}
                    >
                      Add
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}

      {/* Invite link section */}
      <Box mt={3}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Invite Link
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Anyone with this link can join the group. Be careful who you share it with.
        </Alert>
        
        <Button
          variant="outlined"
          startIcon={<LinkIcon />}
          onClick={getInviteLink}
          disabled={isGeneratingLink}
        >
          {isGeneratingLink ? <CircularProgress size={20} /> : 'Get Invite Link'}
        </Button>
      </Box>

      {/* Invite link dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Group Invite Link</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Share this link with people you want to invite to the group:
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ p: 2, mt: 2, display: 'flex', alignItems: 'center' }}
          >
            <Box sx={{ flexGrow: 1, overflow: 'hidden', mr: 1 }}>
              <Typography noWrap>{inviteLink}</Typography>
            </Box>
            <IconButton onClick={copyInviteLink} color="primary">
              <ContentCopy />
            </IconButton>
            <IconButton 
              onClick={regenerateInviteLink} 
              color="secondary"
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Paper>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            For security reasons, you can regenerate the link to invalidate the previous one.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageMembers;
