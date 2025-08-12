import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
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

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const columns = [
    {
      id: 'TODO',
      title: 'To Do',
      color: '#757575',
      icon: <TodoIcon />,
      tasks: tasks.filter(task => task.status === 'TODO'),
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      color: '#1976d2',
      icon: <InProgressIcon />,
      tasks: tasks.filter(task => task.status === 'IN_PROGRESS'),
    },
    {
      id: 'REVIEW',
      title: 'Review',
      color: '#ed6c02',
      icon: <ReviewIcon />,
      tasks: tasks.filter(task => task.status === 'REVIEW'),
    },
    {
      id: 'DONE',
      title: 'Done',
      color: '#2e7d32',
      icon: <DoneIcon />,
      tasks: tasks.filter(task => task.status === 'DONE'),
    },
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    event.stopPropagation();
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out',
        },
        border: isOverdue(task.dueDate) ? '2px solid #d32f2f' : '1px solid #e0e0e0',
      }}
      onClick={() => onTaskClick(task)}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Chip
            label={task.priority}
            color={getPriorityColor(task.priority) as any}
            size="small"
            icon={<FlagIcon />}
          />
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, task)}
            sx={{ ml: 1 }}
          >
            <MoreIcon />
          </IconButton>
        </Box>

        <Typography
          variant="subtitle1"
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {task.assignee ? (
            <Avatar
              sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
              src={task.assignee.avatarUrl || undefined}
            >
              {task.assignee.firstName.charAt(0)}
            </Avatar>
          ) : (
            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          )}

          {task.estimatedHours && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {task.estimatedHours}h
              </Typography>
            </Box>
          )}
        </Box>

        {task.dueDate && (
          <Typography
            variant="body2"
            color={isOverdue(task.dueDate) ? 'error' : 'text.secondary'}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}
          >
            <ScheduleIcon sx={{ fontSize: 16 }} />
            {formatDate(task.dueDate)}
            {isOverdue(task.dueDate) && ' (Overdue)'}
          </Typography>
        )}

        {task.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {task.tags.slice(0, 2).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
              />
            ))}
            {task.tags.length > 2 && (
              <Chip
                label={`+${task.tags.length - 2}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
      {columns.map((column) => (
        <Paper
          key={column.id}
          sx={{
            minWidth: 300,
            maxWidth: 300,
            height: 'fit-content',
            backgroundColor: '#fafafa',
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: `3px solid ${column.color}`,
              backgroundColor: `${column.color}11`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ color: column.color }}>
                {column.icon}
              </Box>
              <Typography variant="h6" sx={{ color: column.color, fontWeight: 600 }}>
                {column.title}
              </Typography>
            </Box>
            <Badge
              badgeContent={column.tasks.length}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: column.color,
                },
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {column.tasks.length} task{column.tasks.length !== 1 ? 's' : ''}
              </Typography>
            </Badge>
          </Box>

          <Box sx={{ p: 2, minHeight: 200 }}>
            {column.tasks.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  color: 'text.secondary',
                }}
              >
                <TaskIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2" textAlign="center">
                  No tasks in this column
                </Typography>
              </Box>
            ) : (
              column.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </Box>
        </Paper>
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

export default KanbanBoard;
