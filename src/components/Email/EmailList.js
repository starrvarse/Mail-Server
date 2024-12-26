import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import { fetchEmails, fetchSentEmails } from '../../store/slices/emailSlice';

const EmailList = ({ view, onEmailSelect, selectedEmail }) => {
  const dispatch = useDispatch();
  const { emails, sentEmails, loading, error } = useSelector((state) => state.email);

  useEffect(() => {
    if (view === 'inbox') {
      dispatch(fetchEmails());
    } else if (view === 'sent') {
      dispatch(fetchSentEmails());
    }
  }, [dispatch, view]);

  const displayEmails = view === 'inbox' ? emails : sentEmails;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (displayEmails.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">No emails found</Typography>
      </Box>
    );
  }

  return (
    <Paper 
      sx={{ 
        height: '100%', 
        overflow: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 1,
      }}
    >
      <List>
        {displayEmails.map((email, index) => (
          <React.Fragment key={email.id}>
            <ListItem
              button
              onClick={() => onEmailSelect(email)}
              sx={{
                bgcolor: selectedEmail?.id === email.id 
                  ? 'action.selected'
                  : email.read 
                    ? 'inherit' 
                    : 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      component="span"
                      variant="body1"
                      sx={{
                        fontWeight: email.read ? 'normal' : 'bold',
                        maxWidth: '70%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {view === 'inbox' ? email.from : email.to}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(email.timestamp)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        fontWeight: email.read ? 'normal' : 'bold',
                        display: 'block',
                      }}
                    >
                      {email.subject}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {email.content}
                    </Typography>
                    {email.attachmentNames?.length > 0 && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                        📎 {email.attachmentNames.length} attachment{email.attachmentNames.length > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
            {index < displayEmails.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

EmailList.propTypes = {
  view: PropTypes.oneOf(['inbox', 'sent']).isRequired,
  onEmailSelect: PropTypes.func.isRequired,
  selectedEmail: PropTypes.shape({
    id: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    read: PropTypes.bool,
    attachmentNames: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default EmailList;
