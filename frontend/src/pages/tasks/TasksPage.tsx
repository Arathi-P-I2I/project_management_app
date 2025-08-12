import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  Alert,
  CircularProgress,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Slider,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  ViewList as ListIcon,
  Dashboard as BoardIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  Folder as ProjectIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AttachFile as AttachIcon,
  Comment as CommentIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '../../store';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  setCurrentTask,
  updateTaskStatus,
} from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import type { Task } from '../../services/taskService';
import type { Project } from '../../services/projectService';
import { TaskForm } from './components/TaskForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
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

export const TasksPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, isLoading, error, filters, pagination } = useSelector((state: RootState) => state.tasks);
  const { projects } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);

  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [tabValue, setTabValue] = useState(0);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTasks({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  useEffect(() => {
    dispatch(fetchProjects({}));
  }, [dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await dispatch(deleteTask(taskId));
    }
  };

  const handleTaskFormSubmit = async (taskData: Partial<Task>) => {
    setIsFormLoading(true);
    try {
      if (editingTask) {
        await dispatch(updateTask({ id: editingTask.id, data: taskData }));
      } else {
        await dispatch(createTask(taskData));
      }
      setIsTaskFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      // Error handling is managed by the Redux store
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await dispatch(updateTaskStatus({ id: taskId, status: newStatus }));
  };

  const filteredTasks = tasks.filter(task => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    done: tasks.filter(t => t.status === 'DONE').length,
  };

  const urgentTasks = tasks.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH');
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE');
  const myTasks = tasks.filter(t => t.assigneeId === user?.id);

  // Enhanced Task Stats Component
  const TaskStats = ({ stats }: { stats: typeof taskStats }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 500, mb: 1 }}>
        Task Overview
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 100, textAlign: 'center', position: 'relative', overflow: 'visible' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
              {stats.total}
            </Box>
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>{stats.total}</Typography>
            <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
            <Box sx={{ mt: 0.5, height: 3, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', bgcolor: 'primary.main', width: '100%' }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 100, textAlign: 'center', bgcolor: 'grey.50' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="h5" sx={{ color: 'warning.main', fontWeight: 600 }}>{stats.todo}</Typography>
            <Typography variant="caption" color="text.secondary">To Do</Typography>
            <Box sx={{ mt: 0.5, height: 3, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', bgcolor: 'warning.main', width: `${(stats.todo / stats.total) * 100}%` }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 100, textAlign: 'center', bgcolor: 'info.50' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="h5" sx={{ color: 'info.main', fontWeight: 600 }}>{stats.inProgress}</Typography>
            <Typography variant="caption" color="text.secondary">In Progress</Typography>
            <Box sx={{ mt: 0.5, height: 3, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', bgcolor: 'info.main', width: `${(stats.inProgress / stats.total) * 100}%` }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 100, textAlign: 'center', bgcolor: 'warning.50' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="h5" sx={{ color: 'warning.main', fontWeight: 600 }}>{stats.review}</Typography>
            <Typography variant="caption" color="text.secondary">Review</Typography>
            <Box sx={{ mt: 0.5, height: 3, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', bgcolor: 'warning.main', width: `${(stats.review / stats.total) * 100}%` }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 100, textAlign: 'center', bgcolor: 'success.50' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 600 }}>{stats.done}</Typography>
            <Typography variant="caption" color="text.secondary">Done</Typography>
            <Box sx={{ mt: 0.5, height: 3, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', bgcolor: 'success.main', width: `${(stats.done / stats.total) * 100}%` }} />
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Quick Action Cards */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
        {urgentTasks.length > 0 && (
          <Card sx={{ minWidth: 150, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <FlagIcon color="error" sx={{ fontSize: 16 }} />
                <Typography variant="h6" color="error.main">{urgentTasks.length}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">Urgent Tasks</Typography>
            </CardContent>
          </Card>
        )}
        {overdueTasks.length > 0 && (
          <Card sx={{ minWidth: 150, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <ScheduleIcon color="warning" sx={{ fontSize: 16 }} />
                <Typography variant="h6" color="warning.main">{overdueTasks.length}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">Overdue Tasks</Typography>
            </CardContent>
          </Card>
        )}
        {myTasks.length > 0 && (
          <Card sx={{ minWidth: 150, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <PersonIcon color="primary" sx={{ fontSize: 16 }} />
                <Typography variant="h6" color="primary.main">{myTasks.length}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">My Tasks</Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );

  // Enhanced Task List Component
  const TaskList = ({ tasks }: { tasks: Task[] }) => (
    <Box>
      {tasks.map((task) => (
        <Card 
          key={task.id} 
          sx={{ 
            mb: 1.5, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid',
            borderColor: 'grey.200',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: 4,
              borderColor: 'primary.main'
            }
          }} 
          onClick={() => handleViewTask(task)}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Chip
                    label={getStatusLabel(task.status)}
                    color={getStatusColor(task.status) as any}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority) as any}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && (
                    <Chip
                      label="Overdue"
                      color="error"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {task.title}
                </Typography>
                {task.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                    {task.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {task.assignee && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                        {task.assignee.firstName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {task.assignee.firstName} {task.assignee.lastName}
                      </Typography>
                    </Box>
                  )}
                  {task.estimatedHours && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {task.estimatedHours}h
                      </Typography>
                    </Box>
                  )}
                  {task.dueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {task.tags.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 18 }}
                        />
                      ))}
                      {task.tags.length > 3 && (
                        <Chip
                          label={`+${task.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 18 }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                  size="small"
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton 
                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                  size="small"
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  // Enhanced Kanban Board Component
  const KanbanBoard = ({ tasks }: { tasks: Task[] }) => {
    const columns = [
      { 
        id: 'TODO', 
        title: 'To Do', 
        color: 'warning.main',
        bgColor: 'warning.50',
        tasks: tasks.filter(t => t.status === 'TODO') 
      },
      { 
        id: 'IN_PROGRESS', 
        title: 'In Progress', 
        color: 'info.main',
        bgColor: 'info.50',
        tasks: tasks.filter(t => t.status === 'IN_PROGRESS') 
      },
      { 
        id: 'REVIEW', 
        title: 'Review', 
        color: 'warning.main',
        bgColor: 'warning.50',
        tasks: tasks.filter(t => t.status === 'REVIEW') 
      },
      { 
        id: 'DONE', 
        title: 'Done', 
        color: 'success.main',
        bgColor: 'success.50',
        tasks: tasks.filter(t => t.status === 'DONE') 
      },
    ];

    return (
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
        {columns.map((column) => (
          <Paper 
            key={column.id} 
            sx={{ 
              minWidth: 280, 
              p: 1.5, 
              bgcolor: column.bgColor,
              border: '1px solid',
              borderColor: `${column.color}20`,
              borderRadius: 2,
              boxShadow: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: column.color }} />
              <Typography variant="h6" sx={{ color: column.color, fontWeight: 600, fontSize: '1rem' }}>
                {column.title}
              </Typography>
              <Chip 
                label={column.tasks.length} 
                size="small" 
                sx={{ ml: 'auto', bgcolor: column.color, color: 'white', fontSize: '0.7rem' }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 150 }}>
              {column.tasks.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: 80,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  color: 'text.secondary'
                }}>
                  <Typography variant="body2">No tasks</Typography>
                </Box>
              ) : (
                column.tasks.map((task) => (
                  <Card 
                    key={task.id} 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }} 
                    onClick={() => handleViewTask(task)}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1 }}>
                        <Chip
                          label={task.priority}
                          color={getPriorityColor(task.priority) as any}
                          size="small"
                          sx={{ fontSize: '0.6rem' }}
                        />
                        {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && (
                          <Chip
                            label="Overdue"
                            color="error"
                            size="small"
                            sx={{ fontSize: '0.6rem' }}
                          />
                        )}
                      </Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: '0.9rem' }}>
                        {task.title}
                      </Typography>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.4, fontSize: '0.8rem' }}>
                          {task.description.length > 50 ? `${task.description.substring(0, 50)}...` : task.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        {task.assignee && (
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                            {task.assignee.firstName.charAt(0)}
                          </Avatar>
                        )}
                        {task.estimatedHours && (
                          <Typography variant="caption" color="text.secondary">
                            {task.estimatedHours}h
                          </Typography>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <Chip
                            label={task.tags[0]}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.5rem', height: 18 }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2, height: '100vh', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track your project tasks efficiently
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={viewMode === 'list' ? <BoardIcon /> : <ListIcon />}
            onClick={() => setViewMode(viewMode === 'list' ? 'board' : 'list')}
            sx={{ borderRadius: 2 }}
            size="small"
          >
            {viewMode === 'list' ? 'Board View' : 'List View'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            }}
            size="small"
          >
            Create Task
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <TaskStats stats={taskStats} />

      {/* Search and Filters */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon />,
              endAdornment: searchTerm && (
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon />
                </IconButton>
              ),
            }}
            sx={{ minWidth: 250 }}
            size="small"
          />
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {viewMode === 'board' ? (
            <KanbanBoard tasks={filteredTasks} />
          ) : (
            <TaskList tasks={filteredTasks} />
          )}
        </>
      )}

             {/* Task Form Dialog */}
       <Dialog
         open={isTaskFormOpen}
         onClose={() => setIsTaskFormOpen(false)}
         maxWidth="lg"
         fullWidth
       >
         <TaskForm
           task={editingTask}
           projects={projects}
           onSubmit={handleTaskFormSubmit}
           onCancel={() => setIsTaskFormOpen(false)}
           isLoading={isFormLoading}
         />
       </Dialog>

      {/* Task Details Dialog */}
      <Dialog
        open={isTaskDetailsOpen}
        onClose={() => setIsTaskDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedTask && (
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {selectedTask.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={getStatusLabel(selectedTask.status)}
                      color={getStatusColor(selectedTask.status) as any}
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={selectedTask.priority}
                      color={getPriorityColor(selectedTask.priority) as any}
                      sx={{ fontWeight: 600 }}
                    />
                    {selectedTask.dueDate && new Date(selectedTask.dueDate) < new Date() && selectedTask.status !== 'DONE' && (
                      <Chip
                        label="Overdue"
                        color="error"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setIsTaskDetailsOpen(false);
                      handleEditTask(selectedTask);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setIsTaskDetailsOpen(false);
                      handleDeleteTask(selectedTask.id);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 4 }}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Description
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {selectedTask.description || 'No description provided'}
                  </Typography>

                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedTask.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Task Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedTask.assignee && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {selectedTask.assignee.firstName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedTask.assignee.firstName} {selectedTask.assignee.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Assigned
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {selectedTask.estimatedHours && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                        <ScheduleIcon color="info" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedTask.estimatedHours} hours
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Estimated
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {selectedTask.dueDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                        <CalendarIcon color="warning" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(selectedTask.dueDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due Date
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                      <ProjectIcon color="primary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedTask.project?.name || 'Unknown Project'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Project
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add task"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateTask}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}; 