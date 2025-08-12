import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Stepper,
  Step,
  StepLabel,
  Link
} from '@mui/material';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { forgotPassword, resetPassword } from '../../store/slices/authSlice';

interface PasswordResetFlowProps {
  onBackToLogin: () => void;
}

export const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({
  onBackToLogin
}) => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const dispatch = useDispatch<AppDispatch>();

  const steps = ['Enter Email', 'Check Email', 'Reset Password'];

  const validateEmail = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    setMessage('');

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setStep(1);
      setMessage('Password reset instructions have been sent to your email.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setIsLoading(true);
    setMessage('');

    try {
      await dispatch(resetPassword({ token, newPassword })).unwrap();
      setStep(2);
      setMessage('Password has been reset successfully! You can now log in with your new password.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    if (errors.token) {
      setErrors(prev => ({ ...prev, token: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: '' }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Forgot your password?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={isLoading}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Check your email
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We've sent password reset instructions to <strong>{email}</strong>
            </Typography>
            
            <TextField
              fullWidth
              label="Reset Token"
              value={token}
              onChange={handleTokenChange}
              error={!!errors.token}
              helperText={errors.token || "Enter the token from your email"}
              disabled={isLoading}
              sx={{ mb: 3 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={() => setStep(2)}
              disabled={!token.trim()}
              sx={{ mb: 2 }}
            >
              Continue
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Reset your password
            </Typography>
            
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={handlePasswordChange}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={isLoading}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Stepper activeStep={step} sx={{ width: '100%', mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {message && (
          <Alert 
            severity={step === 2 ? 'success' : 'info'} 
            sx={{ width: '100%', mb: 3 }}
          >
            {message}
          </Alert>
        )}

        {renderStepContent()}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link
            component="button"
            variant="body2"
            onClick={onBackToLogin}
            sx={{ cursor: 'pointer' }}
          >
            Back to Sign In
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default PasswordResetFlow; 