import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import { 
  Assignment as TaskIcon,
  Folder as ProjectIcon,
  Schedule as TimeIcon,
  TrendingUp as ProgressIcon
} from '@mui/icons-material';

interface UserStatsProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
  };
  stats?: {
    totalTasks: number;
    completedTasks: number;
    totalProjects: number;
    totalHours: number;
    completionRate: number;
  };
}

export const UserStats: React.FC<UserStatsProps> = ({ user, stats }) => {
  const defaultStats = {
    totalTasks: 0,
    completedTasks: 0,
    totalProjects: 0,
    totalHours: 0,
    completionRate: 0
  };

  const userStats = stats || defaultStats;
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Activity Overview
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* User Info Card */}
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ mr: 2, width: 56, height: 56, fontSize: '1.5rem' }}>
                {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {user?.firstName || ''} {user?.lastName || ''}
                </Typography>
                <Chip 
                  label={user?.role || 'User'} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Member since {user?.createdAt ? memberSince : 'N/A'}
            </Typography>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <TaskIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" component="div">
                {userStats.totalTasks}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Tasks
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <ProgressIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" component="div">
                {userStats.completedTasks}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Completed
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <ProjectIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" component="div">
                {userStats.totalProjects}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Projects
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <TimeIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" component="div">
                {userStats.totalHours}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Hours
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Progress Section */}
      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>
          Task Completion Rate
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <LinearProgress 
            variant="determinate" 
            value={userStats.completionRate} 
            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="textSecondary">
            {userStats.completionRate}%
          </Typography>
        </Box>
      </Box>

      {/* Recent Activity Placeholder */}
      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="textSecondary">
          No recent activity to display.
        </Typography>
      </Box>
    </Paper>
  );
};
