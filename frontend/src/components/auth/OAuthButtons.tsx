import React from 'react';
import {
  Button,
  Box,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Google as GoogleIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';

interface OAuthButtonsProps {
  isLoading?: boolean;
  onGoogleLogin?: () => void;
  onGitHubLogin?: () => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  isLoading = false,
  onGoogleLogin,
  onGitHubLogin
}) => {
  const handleGoogleLogin = () => {
    if (onGoogleLogin) {
      onGoogleLogin();
    } else {
      // Default implementation - redirect to backend OAuth endpoint
      const googleAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/auth/google`;
      window.location.href = googleAuthUrl;
    }
  };

  const handleGitHubLogin = () => {
    if (onGitHubLogin) {
      onGitHubLogin();
    } else {
      // Default implementation - redirect to backend OAuth endpoint
      const githubAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/auth/github`;
      window.location.href = githubAuthUrl;
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>
      
      <Button
        fullWidth
        variant="outlined"
        startIcon={isLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
        onClick={handleGoogleLogin}
        disabled={isLoading}
        sx={{
          mb: 2,
          borderColor: '#4285f4',
          color: '#4285f4',
          '&:hover': {
            borderColor: '#3367d6',
            backgroundColor: 'rgba(66, 133, 244, 0.04)'
          }
        }}
      >
        Continue with Google
      </Button>
      
      <Button
        fullWidth
        variant="outlined"
        startIcon={isLoading ? <CircularProgress size={20} /> : <GitHubIcon />}
        onClick={handleGitHubLogin}
        disabled={isLoading}
        sx={{
          borderColor: '#24292e',
          color: '#24292e',
          '&:hover': {
            borderColor: '#1b1f23',
            backgroundColor: 'rgba(36, 41, 46, 0.04)'
          }
        }}
      >
        Continue with GitHub
      </Button>
    </Box>
  );
};

export default OAuthButtons; 