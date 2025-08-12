import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch<AppDispatch>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Add error handling for useAuth hook
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    // Return a fallback header if auth context is not available
    return (
      <AppBar
        position="sticky"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Project Management Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }

  const { user, handleLogout } = authData;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    try {
      handleLogout();
      handleMenuClose();
    } catch (error) {
      // Error handling is managed by the auth context
      handleMenuClose();
    }
  };

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Project Management Dashboard
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* User Menu */}
          <IconButton
            onClick={handleMenuOpen}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
              }}
            >
              {user && user.firstName && user.lastName 
                ? `${user.firstName[0]}${user.lastName[0]}` 
                : 'U'
              }
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleMenuClose}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogoutClick}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 