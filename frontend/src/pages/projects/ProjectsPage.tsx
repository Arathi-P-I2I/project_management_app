import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
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
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  Avatar,
  Tooltip,
  Fab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Flag as PriorityIcon,
  CheckCircle as CompletedIcon,
  Pause as OnHoldIcon,
  Cancel as CancelledIcon,
  PlayArrow as ActiveIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Label as TagIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '../../store';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  setFilters,
  clearFilters,
  setPagination,
} from '../../store/slices/projectSlice';
import type { Project } from '../../store/slices/projectSlice';

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface ProjectFormData {
  name: string;
  description: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate: string;
  endDate: string;
  tags: string;
}

const initialFormData: ProjectFormData = {
  name: '',
  description: '',
  status: 'ACTIVE',
  priority: 'MEDIUM',
  startDate: '',
  endDate: '',
  tags: '',
};

export const ProjectsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, isLoading, error, filters, pagination } = useSelector(
    (state: RootState) => state.projects
  );

  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectDetailsDialogOpen, setProjectDetailsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);


  useEffect(() => {
    dispatch(fetchProjects({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(setFilters({ search: searchTerm }));
      dispatch(fetchProjects({ page: 1, limit: pagination.limit }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, dispatch, pagination.limit]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const statusMap = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    if (newValue > 0) {
      const selectedStatus = statusMap[newValue - 1];
      setSearchTerm(''); // Clear local search term
      dispatch(setFilters({ status: [selectedStatus], search: '' })); // Clear search in Redux state
      dispatch(fetchProjects({ page: 1, limit: pagination.limit }));
    } else {
      setSearchTerm(''); // Clear local search term
      dispatch(clearFilters());
      dispatch(fetchProjects({ page: 1, limit: pagination.limit }));
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        priority: project.priority,
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        tags: project.tags.join(', '),
      });
    } else {
      setEditingProject(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    const projectData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };

    if (editingProject) {
      await dispatch(updateProject({ id: editingProject.id, data: projectData }));
    } else {
      await dispatch(createProject(projectData));
    }
    handleCloseDialog();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await dispatch(deleteProject(projectId));
        // Show success message or handle as needed
      } catch (error) {
        // Error handling is managed by the Redux store
      }
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setPagination({ page }));
    dispatch(fetchProjects({ 
      page, 
      limit: pagination.limit
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <ActiveIcon color="success" />;
      case 'ON_HOLD':
        return <OnHoldIcon color="warning" />;
      case 'COMPLETED':
        return <CompletedIcon color="success" />;
      case 'CANCELLED':
        return <CancelledIcon color="error" />;
      default:
        return <ActiveIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'primary';
      case 'HIGH':
        return 'warning';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_HOLD':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setProjectDetailsDialogOpen(true);
  };

  const handleCloseProjectDetailsDialog = () => {
    setProjectDetailsDialogOpen(false);
    setSelectedProject(null);
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Projects Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
            <Tab label="All Projects" />
            <Tab label="Active" />
            <Tab label="On Hold" />
            <Tab label="Completed" />
            <Tab label="Cancelled" />
          </Tabs>
        </Box>

                <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <TextField
                fullWidth
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority.length > 0 ? filters.priority[0] : ''}
                  label="Priority"
                  onChange={(e) => {
                    const value = e.target.value as string;
                    const priorityArray = value ? [value] : [];
                    dispatch(setFilters({ priority: priorityArray }));
                    dispatch(fetchProjects({ page: 1, limit: pagination.limit }));
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  dispatch(clearFilters());
                  setSearchTerm('');
                  setTabValue(0);
                  dispatch(fetchProjects({ page: 1, limit: pagination.limit }));
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {projects.map((project) => (
              <Box key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                        {project.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          icon={getStatusIcon(project.status)}
                          label={project.status.replace('_', ' ')}
                          color={getStatusColor(project.status) as any}
                          size="small"
                        />
                        <Chip
                          icon={<PriorityIcon />}
                          label={project.priority}
                          color={getPriorityColor(project.priority) as any}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description || 'No description available'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {project.manager.firstName} {project.manager.lastName}
                      </Typography>
                    </Box>

                    {project.startDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(project.startDate).toLocaleDateString()}
                          {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                        </Typography>
                      </Box>
                    )}



                    {project.tags.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {project.tags.slice(0, 3).map((tag, index) => (
                            <Chip key={index} label={tag} size="small" variant="outlined" />
                          ))}
                          {project.tags.length > 3 && (
                            <Chip label={`+${project.tags.length - 3}`} size="small" variant="outlined" />
                          )}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Box>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewProjectDetails(project)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Project">
                        <IconButton size="small" onClick={() => handleOpenDialog(project)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Project">
                        <IconButton size="small" onClick={() => handleDeleteProject(project.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>

          {pagination.total > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.limit)}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}

          {projects.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No projects found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || filters.status.length > 0 || filters.priority.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Create your first project to get started'}
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Project Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <TextField
                fullWidth
                label="Project Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Box>
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="ON_HOLD">On Hold</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Enter tags separated by commas"
                helperText="Separate tags with commas"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog open={projectDetailsDialogOpen} onClose={handleCloseProjectDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="h2">
              {selectedProject?.name}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseProjectDetailsDialog}
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          {selectedProject && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                icon={getStatusIcon(selectedProject.status)}
                label={selectedProject.status.replace('_', ' ')}
                color={getStatusColor(selectedProject.status) as any}
                size="small"
              />
              <Chip
                icon={<PriorityIcon />}
                label={selectedProject.priority}
                color={getPriorityColor(selectedProject.priority) as any}
                size="small"
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DescriptionIcon sx={{ fontSize: 18, mr: 1 }} /> Description:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedProject?.description || 'No description available'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ fontSize: 18, mr: 1 }} /> Project Manager:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedProject?.manager.firstName} {selectedProject?.manager.lastName}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimeIcon sx={{ fontSize: 18, mr: 1 }} /> Project Duration:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedProject?.startDate ? (
                  <>
                    <strong>Start:</strong> {new Date(selectedProject.startDate).toLocaleDateString()}
                    {selectedProject?.endDate && (
                      <>
                        <br />
                        <strong>End:</strong> {new Date(selectedProject.endDate).toLocaleDateString()}
                      </>
                    )}
                  </>
                ) : (
                  'No start date set'
                )}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TagIcon sx={{ fontSize: 18, mr: 1 }} /> Tags:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {selectedProject?.tags && selectedProject.tags.length > 0 ? (
                  selectedProject.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags assigned
                  </Typography>
                )}
              </Stack>
            </Box>
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarIcon sx={{ fontSize: 18, mr: 1 }} /> Project Timeline:
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedProject?.createdAt && new Date(selectedProject.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Updated:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedProject?.updatedAt && new Date(selectedProject.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            variant="outlined" 
            onClick={() => {
              if (selectedProject) {
                handleCloseProjectDetailsDialog();
                handleOpenDialog(selectedProject);
              }
            }}
          >
            Edit Project
          </Button>
          <Button onClick={handleCloseProjectDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 