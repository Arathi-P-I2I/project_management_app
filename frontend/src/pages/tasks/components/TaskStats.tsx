import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Schedule as TodoIcon,
  PlayArrow as InProgressIcon,
  RateReview as ReviewIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';

interface TaskStatsProps {
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
}

const TaskStats: React.FC<TaskStatsProps> = ({ stats }) => {
  const getProgressPercentage = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.done / stats.total) * 100);
  };

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: <TaskIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'To Do',
      value: stats.todo,
      icon: <TodoIcon />,
      color: '#757575',
      bgColor: '#f5f5f5',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: <InProgressIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'In Review',
      value: stats.review,
      icon: <ReviewIcon />,
      color: '#ed6c02',
      bgColor: '#fff4e5',
    },
    {
      title: 'Completed',
      value: stats.done,
      icon: <DoneIcon />,
      color: '#2e7d32',
      bgColor: '#e8f5e8',
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${card.bgColor} 0%, ${card.bgColor}dd 100%)`,
                border: `1px solid ${card.color}33`,
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: `${card.color}22`,
                    color: card.color,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: card.color }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Progress Bar */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getProgressPercentage()}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getProgressPercentage()}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
              },
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default TaskStats;
