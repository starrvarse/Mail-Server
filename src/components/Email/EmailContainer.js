import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import EmailList from './EmailList';
import EmailView from './EmailView';
import ComposeEmail from './ComposeEmail';

const EmailContainer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentView, setCurrentView] = useState('inbox'); // inbox, sent, compose
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { loading } = useSelector((state) => state.email);

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleViewChange = (event, newValue) => {
    setCurrentView(newValue);
    setSelectedEmail(null);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'compose':
        return <ComposeEmail />;
      case 'inbox':
      case 'sent':
        return selectedEmail ? (
          <EmailView email={selectedEmail} loading={loading} />
        ) : (
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              bgcolor: 'background.paper',
              borderRadius: 1,
            }}
          >
            Select an email to view
          </Box>
        );
      default:
        return null;
    }
  };

  const emailListComponent = (
    <EmailList
      view={currentView}
      onEmailSelect={handleEmailSelect}
      selectedEmail={selectedEmail}
    />
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ mb: 2 }}>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Tabs
          value={currentView}
          onChange={handleViewChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Inbox" value="inbox" />
          <Tab label="Sent" value="sent" />
          <Tab label="Compose" value="compose" />
        </Tabs>
      </Paper>

      {isMobile ? (
        <>
          <Box sx={{ flexGrow: 1 }}>
            {currentView === 'compose' ? (
              <ComposeEmail />
            ) : (
              <Box sx={{ height: '100%' }}>
                {selectedEmail ? (
                  <EmailView email={selectedEmail} loading={loading} />
                ) : (
                  emailListComponent
                )}
              </Box>
            )}
          </Box>
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: '80%',
                maxWidth: 360,
                boxSizing: 'border-box',
              },
            }}
          >
            {emailListComponent}
          </Drawer>
        </>
      ) : (
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          <Grid item xs={12} md={4}>
            {emailListComponent}
          </Grid>
          <Grid item xs={12} md={8} sx={{ display: currentView === 'compose' ? 'none' : 'block' }}>
            {renderMainContent()}
          </Grid>
          {currentView === 'compose' && (
            <Grid item xs={12} md={8}>
              <ComposeEmail />
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

EmailContainer.propTypes = {
  // You can add PropTypes here if the component receives any props
};

export default EmailContainer;
