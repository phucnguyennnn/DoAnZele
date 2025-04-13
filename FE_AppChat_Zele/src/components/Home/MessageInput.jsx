import React from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import {
    AttachFile as AttachFileIcon,
    TagFaces as EmojiIcon,
    Mic as MicIcon
} from '@mui/icons-material';

const MessageInput = () => (
    <Box 
        p={2} 
        bgcolor="white" 
        borderTop="1px solid #e5e5e5"
        display="flex"
        alignItems="center"
    >
        <IconButton>
            <AttachFileIcon />
        </IconButton>
        <IconButton>
            <EmojiIcon />
        </IconButton>
        <TextField
            fullWidth
            variant="outlined"
            placeholder="Nhập tin nhắn..."
            size="small"
            sx={{ mx: 1 }}
        />
        <IconButton>
            <MicIcon />
        </IconButton>
    </Box>
);

export default MessageInput;