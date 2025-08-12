import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Sidebar />
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Header />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: 'background.default',
            minHeight: 'calc(100vh - 64px)', // Subtract header height
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}; 