import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { sendEmail } from '../../store/slices/emailSlice';

const ComposeEmail = () => {
  const dispatch = useDispatch();
  const domains = useSelector(state => state.admin.domains);
  const users = useSelector(state => state.admin.users);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Get verified domains
  const verifiedDomains = useMemo(() => 
    domains.filter(domain => domain.verified).map(domain => domain.name),
    [domains]
  );

  // Get email suggestions from users in verified domains
  const emailSuggestions = useMemo(() => 
    users
      .filter(user => {
        const domain = user.email.split('@')[1];
        return verifiedDomains.includes(domain) && user.active;
      })
      .map(user => ({
        label: `${user.fullName} <${user.email}>`,
        email: user.email
      })),
    [users, verifiedDomains]
  );

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Invalid email format';
    }
    const domain = email.split('@')[1];
    if (!verifiedDomains.includes(domain)) {
      return `Email must be from one of these domains: ${verifiedDomains.join(', ')}`;
    }
    return '';
  };

  const handleToChange = (event, newValue) => {
    const email = newValue ? newValue.email : event?.target?.value || '';
    setTo(email);
    const validationError = validateEmail(email);
    setEmailError(validationError);
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      setError('Some files were too large. Maximum size is 10MB per file.');
    }

    setAttachments(prevAttachments => [...prevAttachments, ...validFiles]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prevAttachments => 
      prevAttachments.filter((_, i) => i !== index)
    );
  };

  const handleSend = async () => {
    const emailValidation = validateEmail(to);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    if (!subject || !content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSending(true);
    setError('');

    try {
      await dispatch(sendEmail({
        to,
        subject,
        content,
        attachments
      })).unwrap();

      // Clear form after successful send
      setTo('');
      setSubject('');
      setContent('');
      setAttachments([]);
      setEmailError('');
    } catch (err) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Compose Email</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Autocomplete
          freeSolo
          options={emailSuggestions}
          getOptionLabel={(option) => 
            typeof option === 'string' ? option : option.label
          }
          value={to}
          onChange={handleToChange}
          onInputChange={(event, newInputValue) => {
            setTo(newInputValue);
            const validationError = validateEmail(newInputValue);
            setEmailError(validationError);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="To"
              error={!!emailError}
              helperText={emailError || `Valid domains: ${verifiedDomains.join(', ')}`}
              placeholder="recipient@domain.com"
            />
          )}
        />

        <TextField
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          error={!!error && !subject}
          helperText={error && !subject ? 'Required' : ''}
        />

        <TextField
          label="Message"
          multiline
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={!!error && !content.trim()}
          helperText={error && !content.trim() ? 'Required' : ''}
          sx={{ flexGrow: 1 }}
        />

        <Box sx={{ mt: 2 }}>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="attachment-button"
            type="file"
            multiple
            onChange={handleAttachmentChange}
          />
          <label htmlFor="attachment-button">
            <Button variant="outlined" component="span">
              Attach Files
            </Button>
          </label>

          {attachments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {attachments.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                    {file.name}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={sending || !to || !subject || !content.trim() || !!emailError}
          >
            {sending ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ComposeEmail;
