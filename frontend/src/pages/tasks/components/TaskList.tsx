import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Assignment as TaskIcon,
  CheckCircle as DoneIcon,
  PlayArrow as InProgressIcon,
  RateReview as ReviewIcon,
  RadioButtonUnchecked as TodoIcon,
} from '@mui/icons-material';
import type { Task } from '../../../services/taskService';

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleMenuAction = (action: string) => {
    if (!selectedTask) return;

    switch (action) {
      case 'view':
        onTaskClick(selectedTask);
        break;
      case 'edit':
        onEditTask(selectedTask);
        break;
      case 'delete':
        onDeleteTask(selectedTask.id);
        break;
    }
    handleMenuClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <TodoIcon />;
      case 'IN_PROGRESS':
        return <InProgressIcon />;
      case 'REVIEW':
        return <ReviewIcon />;
      case 'DONE':
        return <DoneIcon />;
      default:
        return <TaskIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'default';
      case 'IN_PROGRESS':
        return 'primary';
      case 'REVIEW':
        return 'warning';
      case 'DONE':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'To Do';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'REVIEW':
        return 'Review';
      case 'DONE':
        return 'Done';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (tasks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No tasks found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first task to get started
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {tasks.map((task) => (
        <Card
          key={task.id}
          sx={{
            mb: 2,
            cursor: 'pointer',
            '&:hover': {
              boxShadow: 3,
              transform: 'translateY(-1px)',
              transition: 'all 0.2s ease-in-out',
            },
          }}
          onClick={() => onTaskClick(task)}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    icon={getStatusIcon(task.status)}
                    label={getStatusLabel(task.status)}
                    color={getStatusColor(task.status) as any}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority) as any}
                    size="small"
                    icon={<FlagIcon />}
                  />
                  {task.project && (
                    <Chip
                      label={task.project.name}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.title}
                </Typography>

                {task.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {task.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  {task.assignee ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                        src={task.assignee.avatarUrl || undefined}
                      >
                        {task.assignee.firstName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {task.assignee.firstName} {task.assignee.lastName}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    </Box>
                  )}

                  {task.estimatedHours && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {task.estimatedHours}h
                      </Typography>
                    </Box>
                  )}

                  {task.actualHours > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      ({task.actualHours}h logged)
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {task.dueDate && (
                    <Typography
                      variant="body2"
                      color={isOverdue(task.dueDate) ? 'error' : 'text.secondary'}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <ScheduleIcon sx={{ fontSize: 16 }} />
                      Due: {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate) && ' (Overdue)'}
                    </Typography>
                  )}
                </Box>

                {task.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {task.tags.slice(0, 3).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {task.tags.length > 3 && (
                      <Chip
                        label={`+${task.tags.length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </Box>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuOpen(e, task);
                }}
                sx={{ ml: 1 }}
              >
                <MoreIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Task</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleMenuAction('delete')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Task</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskList;
