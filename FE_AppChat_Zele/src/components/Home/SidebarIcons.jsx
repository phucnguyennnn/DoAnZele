import React, { useEffect, useState } from 'react';
import { Box, Avatar, IconButton, Badge, Tooltip } from '@mui/material';
import {
  Chat as ChatIcon,
  Group as GroupIcon,
  Contacts as ContactsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

const decryptData = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

const SidebarIcons = ({ onLogout }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const encrypted = localStorage.getItem('user');
    const user = decryptData(encrypted);
    setCurrentUser(user);
  }, []);

  return (
    <Box
      width="70px"
      bgcolor="#0573ff"
      display="flex"
      flexDirection="column"
      alignItems="center"
      pt={2}
    >
      <Tooltip title={currentUser?.name || "Người dùng"} placement="right">
        <Box mb={3}>
          <Avatar
            src={currentUser?.avatar || "https://i.pravatar.cc/150?img=6"}
            sx={{ width: 48, height: 48, cursor: 'pointer' }}
          />
        </Box>
      </Tooltip>

      <Tooltip title="Tin nhắn" placement="right">
        <IconButton sx={{ mb: 2, color: '#ffffff' }}>
          <Badge color="error" badgeContent={5}>
            <ChatIcon sx={{ fontSize: 28 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Tooltip title="Danh bạ" placement="right">
        <IconButton sx={{ mb: 2, color: '#ffffff' }}>
          <ContactsIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Nhóm chat" placement="right">
        <IconButton sx={{ mb: 2, color: '#ffffff' }}>
          <GroupIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>

      <Box flex={1} />

      <Tooltip title="Cài đặt" placement="right">
        <IconButton sx={{ mb: 2, color: '#ffffff' }}>
          <SettingsIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Đăng xuất" placement="right">
        <IconButton sx={{ mb: 2, color: '#ffffff' }} onClick={onLogout}>
          <LogoutIcon sx={{ fontSize: 30 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default SidebarIcons;
