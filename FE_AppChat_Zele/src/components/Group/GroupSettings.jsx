import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  TextField,
  Divider,
  MenuItem,
  Menu,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Edit,
  Delete,
  PhotoCamera,
  ContentCopy,
  Refresh,
  Close,
  PersonAdd,
  MoreVert,
} from '@mui/icons-material';
import axios from 'axios';
import socket from '../../socket/socket';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`group-tabpanel-${index}`}
      aria-labelledby={`group-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GroupSettings = ({ open, group, onClose, onUpdate, onDelete }) => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [memberActionAnchorEl, setMemberActionAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [messageSettings, setMessageSettings] = useState('all');
  const [memberSettings, setMemberSettings] = useState('admins');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('accessToken');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  // Check if current user is admin
  const isAdmin = group?.members?.some(
    member => member.user._id === currentUser._id && member.role === 'admin'
  );
  
  // Check if current user is moderator
  const isModerator = group?.members?.some(
    member => member.user._id === currentUser._id && member.role === 'moderator'
  );

  // Get group details on open
  useEffect(() => {
    if (open && group) {
      setGroupName(group.name || '');
      setGroupDescription(group.description || '');
      setAvatarPreview(group.avatar || '');
      setMessageSettings(group.settings?.who_can_send_messages || 'all');
      setMemberSettings(group.settings?.who_can_add_members || 'admins');
      
      // Get invite link if admin or moderator
      if (isAdmin || isModerator) {
        fetchInviteLink();
      }
    }
  }, [open, group]);

  const fetchInviteLink = async () => {
    if (!group?._id) return;
    
    try {
      setInviteLinkLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/group/${group._id}/invite`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        setInviteLink(response.data.data.invite_link.url || '');
      }
    } catch (error) {
      console.error('Error fetching invite link:', error);
    } finally {
      setInviteLinkLoading(false);
    }
  };

  const regenerateInviteLink = async () => {
    if (!group?._id || !isAdmin) return;
    
    try {
      setInviteLinkLoading(true);
      const response = await axios.post(
        `http://localhost:5000/api/group/${group._id}/invite/regenerate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        setInviteLink(response.data.data.invite_link.url || '');
      }
    } catch (error) {
      console.error('Error regenerating invite link:', error);
    } finally {
      setInviteLinkLoading(false);
    }
  };

  const toggleInviteLinkStatus = async (isActive) => {
    if (!group?._id || !isAdmin) return;
    
    try {
      setInviteLinkLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/group/${group._id}/invite`,
        { isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.status === 'success') {
        fetchInviteLink(); // Refresh the link
      }
    } catch (error) {
      console.error('Error updating invite link status:', error);
    } finally {
      setInviteLinkLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateGroup = async () => {
    if (!groupName.trim() || !group?._id) return;
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', groupName);
      formData.append('description', groupDescription);
      
      if (avatar) {
        formData.append('avatar', avatar);
      }
      
      // Add settings
      if (isAdmin) {
        formData.append('settings[who_can_send_messages]', messageSettings);
        formData.append('settings[who_can_add_members]', memberSettings);
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
        setEditMode(false);
        if (onUpdate) {
          onUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group?._id || !isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await axios.delete(
          `http://localhost:5000/api/group/${group._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data.status === 'success') {
          if (onDelete) {
            onDelete(group._id);
          }
          onClose();
        }
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !group?._id) return;
    
    try {
      setSearchLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/user/search?query=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && res.data.data) {
        // Filter out users who are already members
        const memberIds = group.members.map(m => m.user._id);
        const filteredResults = res.data.data.filter(
          user => !memberIds.includes(user._id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addMember = async (userId) => {
    try {
      setSearchLoading(true);
      const response = await axios.post(
        'http://localhost:5000/api/group/member/add',
        {
          groupId: group._id,
          memberId: userId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.status === 'success') {
        // Remove user from search results
        setSearchResults(searchResults.filter(user => user._id !== userId));
        // Update group data with new member
        if (onUpdate) {
          onUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!group?._id) return;
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/group/member/remove',
        {
          groupId: group._id,
          memberId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.status === 'success') {
        // Update group data with member removed
        if (onUpdate) {
          onUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setMemberActionAnchorEl(null);
      setSelectedMember(null);
    }
  };

  const changeRole = async (memberId, newRole) => {
    if (!group?._id || !isAdmin) return;
    
    try {
      const response = await axios.put(
        'http://localhost:5000/api/group/member/role',
        {
          groupId: group._id,
          memberId,
          role: newRole
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.status === 'success') {
        // Update group data with role changed
        if (onUpdate) {
          onUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change role. Please try again.');
    } finally {
      setMemberActionAnchorEl(null);
      setSelectedMember(null);
    }
  };

  const handleMemberMenu = (event, member) => {
    setMemberActionAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMemberMenuClose = () => {
    setMemberActionAnchorEl(null);
    setSelectedMember(null);
  };

  // Handle search input with debounce
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

  // Update settings
  const updateSettings = async () => {
    if (!group?._id || !isAdmin) return;
    
    try {
      setSettingsLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/group/${group._id}`,
        {
          settings: {
            who_can_send_messages: messageSettings,
            who_can_add_members: memberSettings
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.status === 'success') {
        if (onUpdate) {
          onUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Group Settings</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="Info" />
        <Tab label="Members" />
        {isAdmin && <Tab label="Settings" />}
        {(isAdmin || isModerator) && <Tab label="Invite" />}
      </Tabs>
      
      <DialogContent>
        {/* Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Box position="relative">
              <Avatar
                src={avatarPreview}
                sx={{ width: 120, height: 120 }}
              />
              {editMode && (
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
              )}
            </Box>
            
            {editMode ? (
              <>
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
                  rows={3}
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleUpdateGroup}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : "Save Changes"}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="h5">{group?.name}</Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  {group?.description || 'No description'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created by: {group?.creator?.name || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(group?.created_at).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Members: {group?.members?.length || 0}
                </Typography>
                
                {isAdmin && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<Edit />}
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleDeleteGroup}
                    >
                      Delete Group
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </TabPanel>
        
        {/* Members Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            {(isAdmin || isModerator) && (
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Add Members
                </Typography>
                <TextField
                  label="Search users to add"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    endAdornment: searchLoading ? <CircularProgress size={20} /> : null,
                  }}
                />
                
                {searchResults.length > 0 && (
                  <Paper elevation={2} sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                      {searchResults.map(user => (
                        <ListItem
                          key={user._id}
                          secondaryAction={
                            <Button 
                              size="small" 
                              startIcon={<PersonAdd />}
                              onClick={() => addMember(user._id)}
                            >
                              Add
                            </Button>
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
                  </Paper>
                )}
              </Box>
            )}
            
            <Divider />
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Members ({group?.members?.length || 0})
            </Typography>
            
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {group?.members?.map(member => {
                const isCurrentUser = member.user._id === currentUser._id;
                const isCreator = member.user._id === group.creator._id;
                
                return (
                  <ListItem
                    key={member.user._id}
                    secondaryAction={
                      (isAdmin || (isModerator && member.role === 'member')) && !isCreator && !isCurrentUser ? (
                        <IconButton edge="end" onClick={(e) => handleMemberMenu(e, member)}>
                          <MoreVert />
                        </IconButton>
                      ) : null
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={member.user.primary_avatar} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box component="span" display="flex" alignItems="center">
                          {member.user.name}
                          {isCreator && (
                            <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                              (Creator)
                            </Typography>
                          )}
                          {isCurrentUser && (
                            <Typography variant="caption" color="secondary" sx={{ ml: 1 }}>
                              (You)
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)} • 
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
          
          {/* Member Action Menu */}
          <Menu
            anchorEl={memberActionAnchorEl}
            open={Boolean(memberActionAnchorEl)}
            onClose={handleMemberMenuClose}
          >
            {isAdmin && selectedMember?.role !== 'admin' && (
              <MenuItem onClick={() => changeRole(selectedMember.user._id, 'admin')}>
                Make Admin
              </MenuItem>
            )}
            {isAdmin && selectedMember?.role !== 'moderator' && (
              <MenuItem onClick={() => changeRole(selectedMember.user._id, 'moderator')}>
                Make Moderator
              </MenuItem>
            )}
            {isAdmin && selectedMember?.role !== 'member' && (
              <MenuItem onClick={() => changeRole(selectedMember.user._id, 'member')}>
                Make Member
              </MenuItem>
            )}
            <MenuItem 
              onClick={() => removeMember(selectedMember.user._id)}
              sx={{ color: 'error.main' }}
            >
              Remove from Group
            </MenuItem>
          </Menu>
        </TabPanel>
        
        {/* Settings Tab */}
        {isAdmin && (
          <TabPanel value={tabValue} index={2}>
            <Box display="flex" flexDirection="column" gap={3}>
              <FormControl fullWidth>
                <InputLabel>Who can send messages</InputLabel>
                <Select
                  value={messageSettings}
                  label="Who can send messages"
                  onChange={(e) => setMessageSettings(e.target.value)}
                >
                  <MenuItem value="all">All members</MenuItem>
                  <MenuItem value="admins_moderators">Admins and moderators only</MenuItem>
                  <MenuItem value="admins">Admins only</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Who can add members</InputLabel>
                <Select
                  value={memberSettings}
                  label="Who can add members"
                  onChange={(e) => setMemberSettings(e.target.value)}
                >
                  <MenuItem value="all">All members</MenuItem>
                  <MenuItem value="admins_moderators">Admins and moderators only</MenuItem>
                  <MenuItem value="admins">Admins only</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                onClick={updateSettings}
                disabled={settingsLoading}
              >
                {settingsLoading ? <CircularProgress size={24} /> : "Save Settings"}
              </Button>
            </Box>
          </TabPanel>
        )}
        
        {/* Invite Tab */}
        {(isAdmin || isModerator) && (
          <TabPanel value={tabValue} index={3}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="subtitle1">
                Share this link to invite people to the group
              </Typography>
              
              <Paper
                variant="outlined"
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper' 
                }}
              >
                {inviteLinkLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        flex: 1, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        mr: 1
                      }}
                    >
                      {inviteLink}
                    </Typography>
                    <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                      <IconButton onClick={copyInviteLink}>
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Paper>
              
              {isAdmin && (
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={regenerateInviteLink}
                    disabled={inviteLinkLoading}
                  >
                    Generate New Link
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => toggleInviteLinkStatus(false)}
                    disabled={inviteLinkLoading}
                  >
                    Disable Link
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => toggleInviteLinkStatus(true)}
                    disabled={inviteLinkLoading}
                  >
                    Enable Link
                  </Button>
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary">
                Anyone with this link can join this group.
                {isAdmin && " As an admin, you can generate a new link or disable the current one at any time."}
              </Typography>
            </Box>
          </TabPanel>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupSettings;
