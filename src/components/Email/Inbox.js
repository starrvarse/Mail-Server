import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Fab,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import EmailList from './EmailList';
import EmailView from './EmailView';
import ComposeEmail from './ComposeEmail';

const Inbox = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  useSelector((state) => state.email); // We'll use this later for real-time updates
  
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [mobileViewOpen, setMobileViewOpen] = useState(false);

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    if (isMobile) {
      setMobileViewOpen(true);
    }
  };

  const handleCloseView = () => {
    setSelectedEmail(null);
    setMobileViewOpen(false);
  };

  // Mobile view drawer
  const emailViewDrawer = (
    <Drawer
      anchor="right"
      open={mobileViewOpen}
      onClose={handleCloseView}
      PaperProps={{
        sx: { width: '100%' },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <IconButton
          onClick={handleCloseView}
          sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
        <EmailView email={selectedEmail} onClose={handleCloseView} />
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', position: 'relative' }}>
      {/* Email List */}
      <Box
        sx={{
          flexGrow: 1,
          height: '100%',
          overflow: 'auto',
          display: { xs: 'block', md: selectedEmail ? 'none' : 'block' },
        }}
      >
        <EmailList
          onEmailSelect={handleEmailSelect}
          selectedId={selectedEmail?.id}
        />
      </Box>

      {/* Email View - Desktop */}
      {!isMobile && selectedEmail && (
        <Box
          sx={{
            width: '50%',
            height: '100%',
            overflow: 'auto',
            borderLeft: 1,
            borderColor: 'divider',
          }}
        >
          <EmailView email={selectedEmail} onClose={handleCloseView} />
        </Box>
      )}

      {/* Email View - Mobile */}
      {isMobile && emailViewDrawer}

      {/* Compose Button */}
      <Fab
        color="primary"
        aria-label="compose"
        onClick={() => setComposeOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Compose Dialog */}
      <ComposeEmail
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
      />
    </Box>
  );
};

export default Inbox;
