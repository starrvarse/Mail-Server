import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  fetchDomains,
  fetchUsers,
  addDomain,
  addUser,
  updateUserStatus,
  deleteDomain,
  checkUserExists,
  verifyDomain,
} from '../../store/slices/adminSlice';

// Domain Management Component
const DomainManagement = ({ domains, loading, onAddDomain, onDeleteDomain, dispatch }) => {
  const [open, setOpen] = useState(false);
  const [domainName, setDomainName] = useState('');

  const handleSubmit = () => {
    if (domainName.trim()) {
      onAddDomain(domainName.trim());
      setDomainName('');
      setOpen(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Domains</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Domain
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : domains.length === 0 ? (
        <Typography color="text.secondary">No domains configured</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {domains.map((domain) => (
            <Paper key={domain.id} sx={{ p: 2 }}>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{domain.name}</Typography>
                    <Typography variant="caption" color={domain.verified ? "success.main" : "warning.main"}>
                      {domain.verified ? "Verified" : "Not Verified"}
                    </Typography>
                  </Box>
                  <Box>
                    {!domain.verified && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => dispatch(verifyDomain(domain.id))}
                        sx={{ mr: 1 }}
                      >
                        Verify Domain
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => onDeleteDomain(domain.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
                
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>DNS Records</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add these DNS records to your domain's DNS settings to enable email functionality:
                </Typography>

                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Add these DNS records at your domain registrar
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Replace {domain.name} with your actual domain
                  </Typography>

                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>MX Record</Typography>
                    <Box sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                      MX @ mail.{domain.name} Priority: 10
                    </Box>
                  </Box>

                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>A Records</Typography>
                    <Box sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                      A mail {domain.serverIp || 'YOUR_SERVER_IP'}
                    </Box>
                    <Box sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                      A @ {domain.serverIp || 'YOUR_SERVER_IP'}
                    </Box>
                  </Box>

                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>SPF Record</Typography>
                    <Box sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                      TXT @ "v=spf1 ip4:{domain.serverIp || 'YOUR_SERVER_IP'} -all"
                    </Box>
                  </Box>

                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>DMARC Record</Typography>
                    <Box sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                      TXT _dmarc "v=DMARC1; p=none; rua=mailto:admin@{domain.name}"
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Note: DKIM Record will be added later after initial setup
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  After adding these records, click the Verify Domain button to complete the setup.
                  DNS changes may take up to 48 hours to propagate.
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Domain</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Domain Name"
            fullWidth
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// User Management Component
const UserManagement = ({ users, domains, loading, onAddUser, onUpdateStatus }) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const [userData, setUserData] = useState({
    fullName: '',
    username: '',
    domainId: '',
    role: 'user',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: true,
    message: ''
  });

  // Debounced username check
  useEffect(() => {
    const checkUsername = async () => {
      if (userData.username && userData.domainId) {
        setUsernameStatus({ checking: true, available: true, message: 'Checking availability...' });
        try {
          const result = await dispatch(checkUserExists({
            username: userData.username,
            domainId: userData.domainId
          })).unwrap();
          
          setUsernameStatus({
            checking: false,
            available: !result.exists,
            message: result.exists ? `${result.email} is already taken` : `${result.email} is available`
          });
        } catch (error) {
          setUsernameStatus({
            checking: false,
            available: false,
            message: 'Error checking availability'
          });
        }
      } else {
        setUsernameStatus({
          checking: false,
          available: true,
          message: ''
        });
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [userData.username, userData.domainId, dispatch]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handleSubmit = () => {
    const error = validatePassword(userData.password);
    if (error) {
      setPasswordError(error);
      return;
    }
    
    if (userData.password !== userData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (userData.fullName && userData.username && userData.domainId && userData.password) {
      onAddUser(userData);
      setUserData({
        fullName: '',
        username: '',
        domainId: '',
        role: 'user',
        password: '',
        confirmPassword: '',
      });
      setPasswordError('');
      setOpen(false);
    }
  };

  const selectedDomain = domains.find(d => d.id === userData.domainId);
  const previewEmail = userData.username && selectedDomain 
    ? `${userData.username}@${selectedDomain.name}`
    : '';

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Users</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add User
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : users.length === 0 ? (
        <Typography color="text.secondary">No users configured</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {users.map((user) => (
            <Paper key={user.id} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1">{user.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Domain: {domains.find(d => d.id === user.domainId)?.name || 'Unknown'}
                  </Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    color={user.active ? 'error' : 'success'}
                    onClick={() => onUpdateStatus(user.id, !user.active)}
                  >
                    {user.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            fullWidth
            value={userData.fullName}
            onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Username"
            fullWidth
            value={userData.username}
            onChange={(e) => setUserData({ ...userData, username: e.target.value.toLowerCase() })}
            helperText={usernameStatus.message || (previewEmail ? `Email will be: ${previewEmail}` : 'Select a domain to see the full email')}
            error={!usernameStatus.available}
            disabled={usernameStatus.checking}
          />
          <TextField
            select
            margin="dense"
            label="Domain"
            fullWidth
            value={userData.domainId}
            onChange={(e) => setUserData({ ...userData, domainId: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="">Select a domain</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </TextField>
          <TextField
            type="password"
            margin="dense"
            label="Password"
            fullWidth
            value={userData.password}
            onChange={(e) => {
              setUserData({ ...userData, password: e.target.value });
              setPasswordError('');
            }}
            error={!!passwordError}
            helperText={passwordError || 'Password must be at least 8 characters with uppercase, lowercase, and numbers'}
          />
          <TextField
            type="password"
            margin="dense"
            label="Confirm Password"
            fullWidth
            value={userData.confirmPassword}
            onChange={(e) => {
              setUserData({ ...userData, confirmPassword: e.target.value });
              setPasswordError('');
            }}
            error={!!passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={
              !userData.fullName || 
              !userData.username || 
              !userData.domainId || 
              !userData.password ||
              !userData.confirmPassword ||
              !usernameStatus.available || 
              usernameStatus.checking ||
              !!passwordError
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Main Admin Settings Component
const AdminSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { domains, users, loading, error } = useSelector((state) => state.admin);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchDomains());
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleAddDomain = (name) => {
    dispatch(addDomain({ name, userId: user.uid }));
  };

  const handleDeleteDomain = (domainId) => {
    dispatch(deleteDomain(domainId));
  };

  const handleAddUser = (userData) => {
    dispatch(addUser(userData));
  };

  const handleUpdateUserStatus = (userId, active) => {
    dispatch(updateUserStatus({ userId, active }));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Domains" />
          <Tab label="Users" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {tabValue === 0 ? (
          <DomainManagement
            domains={domains}
            loading={loading}
            onAddDomain={handleAddDomain}
            onDeleteDomain={handleDeleteDomain}
            dispatch={dispatch}
          />
        ) : (
          <UserManagement
            users={users}
            domains={domains}
            loading={loading}
            onAddUser={handleAddUser}
            onUpdateStatus={handleUpdateUserStatus}
          />
        )}
      </Box>
    </Box>
  );
};

export default AdminSettings;
