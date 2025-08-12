import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  IconButton,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Assignment as TaskIcon,
  CheckCircle as DoneIcon,
  PlayArrow as InProgressIcon,
  RateReview as ReviewIcon,
  RadioButtonUnchecked as TodoIcon,
  AttachFile as AttachIcon,
  Comment as CommentIcon,
  Timer as TimerIcon,
  PlayArrow as StartTimerIcon,
  Stop as StopTimerIcon,
  Add as AddIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  Delete as DeleteFileIcon,
} from '@mui/icons-material';
import type { Task } from '../../../services/taskService';

interface TaskDetailsProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

interface Comment {
  id: string;
  comment: string;
  userId: string;
  userName: string;
  createdAt: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  task,
  onEdit,
  onDelete,
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load comments and attachments
    loadComments();
    loadAttachments();
  }, [task.id]);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  const loadComments = async () => {
    // TODO: Implement API call to load comments
    setComments([
      {
        id: '1',
        comment: 'This task is progressing well. Keep up the good work!',
        userId: '1',
        userName: 'John Doe',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const loadAttachments = async () => {
    // TODO: Implement API call to load attachments
    setAttachments([
      {
        id: '1',
        name: 'design-mockup.pdf',
        url: '#',
        size: 2048576,
        uploadedAt: new Date().toISOString(),
      },
    ]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsLoading(true);
    try {
      const comment: Comment = {
        id: Date.now().toString(),
        comment: newComment,
        userId: 'current-user-id',
        userName: 'Current User',
        createdAt: new Date().toISOString(),
      };
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (error) {
      // Error handling is managed by the component state
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setTimerStartTime(new Date());
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setElapsedTime(0);
    // TODO: Save time entry to API
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={getStatusIcon(task.status)}
            label={getStatusLabel(task.status)}
            color={getStatusColor(task.status) as any}
            size="medium"
          />
          <Chip
            label={task.priority}
            color={getPriorityColor(task.priority) as any}
            icon={<FlagIcon />}
            size="medium"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDelete}
          >
            Delete
          </Button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ p: 3 }}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Task Title and Description */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {task.description}
              </Typography>
            )}
            {task.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {task.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            )}
          </Paper>

          {/* Comments Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Comments
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isLoading}
                    >
                      {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                    </IconButton>
                  ),
                }}
              />
            </Box>
            <List>
              {comments.map((comment) => (
                <ListItem key={comment.id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>{comment.userName.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={comment.userName}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {comment.comment}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(comment.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Attachments Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attachments
            </Typography>
            <List>
              {attachments.map((attachment) => (
                <ListItem key={attachment.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <AttachIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={attachment.name}
                    secondary={`${formatFileSize(attachment.size)} • ${new Date(attachment.uploadedAt).toLocaleDateString()}`}
                  />
                  <IconButton>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton color="error">
                    <DeleteFileIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
            <Button
              variant="outlined"
              startIcon={<AttachIcon />}
              sx={{ mt: 2 }}
            >
              Add Attachment
            </Button>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Task Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Project
              </Typography>
              <Typography variant="body1">
                {task.project?.name || 'Unknown Project'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Assignee
              </Typography>
              {task.assignee ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    sx={{ width: 32, height: 32 }}
                    src={task.assignee.avatarUrl || undefined}
                  >
                    {task.assignee.firstName.charAt(0)}
                  </Avatar>
                  <Typography variant="body1">
                    {task.assignee.firstName} {task.assignee.lastName}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Unassigned
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Due Date
              </Typography>
              <Typography
                variant="body1"
                color={isOverdue(task.dueDate) ? 'error' : 'text.primary'}
              >
                {formatDate(task.dueDate)}
                {isOverdue(task.dueDate) && ' (Overdue)'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Estimated Hours
              </Typography>
              <Typography variant="body1">
                {task.estimatedHours ? `${task.estimatedHours}h` : 'Not set'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Actual Hours
              </Typography>
              <Typography variant="body1">
                {task.actualHours}h logged
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1">
                {new Date(task.createdAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {new Date(task.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>

          {/* Time Tracking */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Time Tracking
            </Typography>
            
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h4" component="div" sx={{ fontFamily: 'monospace' }}>
                {formatTime(elapsedTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Session
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isTimerRunning ? (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<StartTimerIcon />}
                  onClick={handleStartTimer}
                >
                  Start Timer
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<StopTimerIcon />}
                  onClick={handleStopTimer}
                >
                  Stop Timer
                </Button>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Time Entries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No time entries yet
              </Typography>
            </Box>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<EditIcon />}
                onClick={onEdit}
              >
                Edit Task
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AttachIcon />}
              >
                Add Attachment
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CommentIcon />}
              >
                Add Comment
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskDetails;
