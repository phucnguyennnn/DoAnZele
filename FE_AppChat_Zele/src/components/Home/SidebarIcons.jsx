import React from 'react';
import { Box, Avatar, IconButton, Badge, Tooltip } from '@mui/material';
import {
    Chat as ChatIcon,
    Group as GroupIcon,
    Contacts as ContactsIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';


const SidebarIcons = ({ onLogout }) => (
    
    <Box
        width="70px"
        bgcolor="#0573ff"
        display="flex"
        flexDirection="column"
        alignItems="center"
        pt={2}
    >
        <Box mb={3}>
            <Avatar 
                src="https://i.pravatar.cc/150?img=6" 
                sx={{ width: 48, height: 48, cursor: 'pointer' }}
            />
        </Box>
        
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

export default SidebarIcons;