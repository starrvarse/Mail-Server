import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import { markEmailAsRead } from '../../store/slices/emailSlice';

const EmailView = ({ email, loading }) => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (email && !email.read) {
      dispatch(markEmailAsRead(email.id));
    }
  }, [email, dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!email) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">Select an email to view</Typography>
      </Box>
    );
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {email.subject}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1">
              From: {email.from}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              To: {email.to}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatDate(email.timestamp)}
          </Typography>
        </Box>

        {email.attachmentNames?.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Attachments:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {email.attachmentNames.map((name, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    startIcon={<span>📎</span>}
                    sx={{ textTransform: 'none' }}
                  >
                    {name}
                  </Button>
                ))}
              </Box>
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        }}>
          <Typography variant="body1">
            {email.content}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default EmailView;
