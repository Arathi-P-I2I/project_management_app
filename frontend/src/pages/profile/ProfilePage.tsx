import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Avatar, 
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { updateProfile, changePassword } from '../../store/slices/authSlice';
import { UserStats } from './components/UserStats';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  
  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);





  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  }, [user]);

  // Handle profile form changes
  const handleProfileChange = (field: keyof ProfileFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Handle password form changes
  const handlePasswordChange = (field: keyof PasswordFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };



  // Handle profile save
  const handleProfileSave = async () => {
    if (!user) return;

    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await dispatch(updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName
      })).unwrap();
      
      setProfileSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (error: any) {
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await dispatch(changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })).unwrap();
      
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordDialog(false);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };



  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Reset forms
  const handleCancelEdit = () => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
    setIsEditingProfile(false);
    setProfileError(null);
  };

  const handleCancelPassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordDialog(false);
    setPasswordError(null);
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, minHeight: '100vh', overflow: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile Settings
      </Typography>

      {/* User Stats Section */}
      <UserStats user={user} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 3 }}>
        {/* Profile Information */}
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                Personal Information
              </Typography>
              {!isEditingProfile ? (
                <IconButton 
                  onClick={() => setIsEditingProfile(true)}
                  color="primary"
                  aria-label="Edit profile"
                >
                  <EditIcon />
                </IconButton>
              ) : (
                <Box>
                  <IconButton 
                    onClick={handleProfileSave}
                    color="primary"
                    disabled={profileLoading}
                    aria-label="Save profile"
                  >
                    {profileLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                  </IconButton>
                  <IconButton 
                    onClick={handleCancelEdit}
                    color="error"
                    aria-label="Cancel edit"
                  >
                    <CancelIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}

            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {profileSuccess}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                             <TextField
                 fullWidth
                 label="First Name"
                 value={profileForm.firstName || ''}
                 onChange={handleProfileChange('firstName')}
                 disabled={!isEditingProfile}
                 variant={isEditingProfile ? 'outlined' : 'filled'}
               />
               <TextField
                 fullWidth
                 label="Last Name"
                 value={profileForm.lastName || ''}
                 onChange={handleProfileChange('lastName')}
                 disabled={!isEditingProfile}
                 variant={isEditingProfile ? 'outlined' : 'filled'}
               />
               <TextField
                 fullWidth
                 label="Email"
                 value={profileForm.email || ''}
                 disabled
                 variant="filled"
                 helperText="Email cannot be changed"
                 sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
               />
               <TextField
                 fullWidth
                 label="Role"
                 value={user?.role || ''}
                 disabled
                 variant="filled"
                 sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
               />
               <TextField
                 fullWidth
                 label="Member Since"
                 value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                 disabled
                 variant="filled"
               />
               <TextField
                 fullWidth
                 label="Last Updated"
                 value={user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : ''}
                 disabled
                 variant="filled"
               />
            </Box>
          </Paper>

          {/* Password Change */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                Security
              </Typography>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setShowPasswordDialog(true)}
              >
                Change Password
              </Button>
            </Box>

            <Typography variant="body2" color="textSecondary">
              Keep your account secure by using a strong password and updating it regularly.
            </Typography>
          </Paper>
        </Box>

                {/* Account Status */}
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Account Status
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Status</Typography>
                <Chip label="Active" color="success" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Email Verified</Typography>
                <Chip label="Verified" color="success" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Two-Factor Auth</Typography>
                <Chip label="Disabled" color="default" size="small" />
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Password Change Dialog */}
      <Dialog 
        open={showPasswordDialog} 
        onClose={handleCancelPassword}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange('currentPassword')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={handlePasswordChange('newPassword')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('new')}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPassword}>Cancel</Button>
          <Button 
            onClick={handlePasswordSave}
            variant="contained"
            disabled={passwordLoading}
          >
            {passwordLoading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 