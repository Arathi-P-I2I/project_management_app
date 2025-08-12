import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Folder as ProjectsIcon,
  Assignment as TasksIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchProjects, type Project } from '../../store/slices/projectSlice';
import { fetchTasks, type Task } from '../../store/slices/taskSlice';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, isLoading: projectsLoading, error: projectsError } = useSelector(
    (state: RootState) => state.projects
  ) as { projects: Project[]; isLoading: boolean; error: string | null };
  const { tasks, isLoading: tasksLoading, error: tasksError } = useSelector(
    (state: RootState) => state.tasks
  ) as { tasks: Task[]; isLoading: boolean; error: string | null };

  useEffect(() => {
    // Fetch data with error handling
    const fetchDashboardData = async () => {
      try {
        await Promise.all([
          dispatch(fetchProjects({ limit: 5 })).unwrap(),
          dispatch(fetchTasks({ limit: 5 })).unwrap(),
        ]);
      } catch (error) {
        // Error handling is managed by the Redux store
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  const isLoading = projectsLoading || tasksLoading;
  const error = projectsError || tasksError;

  // Calculate statistics with null checks
  const totalProjects = projects?.length || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task: Task) => task?.status === 'DONE').length || 0;
  const pendingTasks = tasks?.filter((task: Task) => 
    task?.status && ['TODO', 'IN_PROGRESS', 'REVIEW'].includes(task.status)
  ).length || 0;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={<ProjectsIcon sx={{ color: 'white' }} />}
          color="#1976d2"
        />
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon={<TasksIcon sx={{ color: 'white' }} />}
          color="#dc004e"
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          icon={<CompletedIcon sx={{ color: 'white' }} />}
          color="#2e7d32"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={<PendingIcon sx={{ color: 'white' }} />}
          color="#ed6c02"
        />
      </Box>

      {/* Recent Projects and Tasks */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {/* Recent Projects */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Projects
          </Typography>
          {projects && projects.length > 0 ? (
            <Box>
              {projects.slice(0, 5).map((project: Project) => (
                <Box
                  key={project.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {project.name || 'Unnamed Project'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {project.description || 'No description available'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Status: {project.status || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Priority: {project.priority || 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary">No projects found</Typography>
          )}
        </Paper>

        {/* Recent Tasks */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Tasks
          </Typography>
          {tasks && tasks.length > 0 ? (
            <Box>
              {tasks.slice(0, 5).map((task: Task) => (
                <Box
                  key={task.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {task.title || 'Unnamed Task'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {task.description || 'No description available'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Status: {task.status || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Priority: {task.priority || 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary">No tasks found</Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}; 