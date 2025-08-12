import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Grid,
  Chip,
  Autocomplete,
  FormHelperText,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  AvatarGroup,
  Switch,
  FormControlLabel,
  Slider,
  Rating,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  Folder as ProjectIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AttachFile as AttachIcon,
  Tag as TagIcon,
  Star as StarIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';

import type { Task } from '../../../services/taskService';
import type { Project } from '../../../services/projectService';

interface TaskFormProps {
  task?: Task | null;
  projects: Project[];
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'success' },
  { value: 'MEDIUM', label: 'Medium', color: 'info' },
  { value: 'HIGH', label: 'High', color: 'warning' },
  { value: 'CRITICAL', label: 'Critical', color: 'error' },
];

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: 'default' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'primary' },
  { value: 'REVIEW', label: 'Review', color: 'warning' },
  { value: 'DONE', label: 'Done', color: 'success' },
];

const TAGS_OPTIONS = [
  'Frontend', 'Backend', 'Database', 'API', 'UI/UX', 'Testing', 'Documentation',
  'Bug Fix', 'Feature', 'Enhancement', 'Refactor', 'Performance', 'Security'
];

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  projects,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    projectId: task?.projectId || '',
    assigneeId: task?.assigneeId || '',
    estimatedHours: task?.estimatedHours || 0,
    dueDate: task?.dueDate || '',
    tags: task?.tags || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (formData.estimatedHours && formData.estimatedHours < 0) {
      newErrors.estimatedHours = 'Estimated hours must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority)?.color || 'default';
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'default';
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        {task ? 'Edit Task' : 'Create New Task'}
      </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 500 }}>
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Task Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                placeholder="Enter a descriptive title for the task"
                InputProps={{
                  startAdornment: <TagIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
                sx={{ flex: 1, minWidth: 300 }}
              />
              <FormControl error={!!errors.projectId} sx={{ minWidth: 200 }}>
                <InputLabel>Project</InputLabel>
                <Select
                  value={formData.projectId}
                  onChange={(e) => handleInputChange('projectId', e.target.value)}
                  label="Project"
                  startAdornment={<ProjectIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {project.name.charAt(0)}
                        </Avatar>
                        {project.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.projectId && <FormHelperText>{errors.projectId}</FormHelperText>}
              </FormControl>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide detailed description of the task..."
              sx={{ mt: 2 }}
            />
          </Box>

          {/* Status and Priority */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 500 }}>
              Status & Priority
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  label="Status"
                  startAdornment={<ScheduleIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Chip
                        label={status.label}
                        color={status.color as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  label="Priority"
                  startAdornment={<PriorityIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Chip
                        label={priority.label}
                        color={priority.color as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Assignment and Time */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 500 }}>
              Assignment & Time
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Assignee"
                value={formData.assigneeId}
                onChange={(e) => handleInputChange('assigneeId', e.target.value)}
                placeholder="Enter assignee name or email"
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
                sx={{ minWidth: 200 }}
              />
              <TextField
                type="number"
                label="Estimated Hours"
                value={formData.estimatedHours}
                onChange={(e) => handleInputChange('estimatedHours', parseFloat(e.target.value) || 0)}
                error={!!errors.estimatedHours}
                helperText={errors.estimatedHours}
                InputProps={{
                  startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'action.active' }} />,
                  endAdornment: <InputAdornment position="end">hours</InputAdornment>,
                }}
                sx={{ minWidth: 150 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <TextField
                label="Due Date"
                type="date"
                value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                InputProps={{
                  startAdornment: <CalendarIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
          </Box>

          {/* Additional Settings */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 500 }}>
              Additional Settings
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.priority === 'CRITICAL' || formData.priority === 'HIGH'}
                    onChange={(e) => handleInputChange('priority', e.target.checked ? 'CRITICAL' : 'MEDIUM')}
                    color="error"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlagIcon color="error" />
                    Mark as Urgent (High Priority)
                  </Box>
                }
              />
            </Box>
          </Box>

          {/* Tags */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 500 }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {formData.tags?.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                  deleteIcon={<RemoveIcon />}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Autocomplete
                freeSolo
                options={TAGS_OPTIONS}
                value={newTag}
                onChange={(_, value) => setNewTag(value || '')}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Add tags..."
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <TagIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                )}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
          </Button>
        </Box>
      </Box>
  );
};
