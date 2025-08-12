import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type { TaskFilters as TaskFiltersType } from '../../../services/taskService';
import type { Project } from '../../../services/projectService';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  projects: Project[];
  onFilterChange: (filters: Partial<TaskFiltersType>) => void;
  onClearFilters: () => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  projects,
  onFilterChange,
  onClearFilters,
}) => {
  const statusOptions = [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'DONE', label: 'Done' },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    onFilterChange({ status: newStatuses });
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    onFilterChange({ priority: newPriorities });
  };

  const handleProjectChange = (projectId: string) => {
    onFilterChange({ projectId: projectId || undefined });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    onFilterChange({ assigneeId: assigneeId || undefined });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <Button
          size="small"
          startIcon={<ClearIcon />}
          onClick={onClearFilters}
          disabled={!(filters.status?.length) && !(filters.priority?.length) && !filters.assigneeId && !filters.projectId}
        >
          Clear All
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Status Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Status
        </Typography>
        <FormGroup>
          {statusOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={(filters.status || []).includes(option.value)}
                  onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                  size="small"
                />
              }
              label={option.label}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Priority Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Priority
        </Typography>
        <FormGroup>
          {priorityOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={(filters.priority || []).includes(option.value)}
                  onChange={(e) => handlePriorityChange(option.value, e.target.checked)}
                  size="small"
                />
              }
              label={option.label}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Project Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Project
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Select Project</InputLabel>
          <Select
            value={filters.projectId || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            label="Select Project"
          >
            <MenuItem value="">All Projects</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Assignee Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Assignee
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Select Assignee</InputLabel>
          <Select
            value={filters.assigneeId || ''}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            label="Select Assignee"
          >
            <MenuItem value="">All Assignees</MenuItem>
            <MenuItem value="me">Assigned to Me</MenuItem>
            <MenuItem value="unassigned">Unassigned</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Active Filters Display */}
      {((filters.status?.length || 0) > 0 || (filters.priority?.length || 0) > 0 || filters.assigneeId || filters.projectId) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Active Filters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {(filters.status || []).map((status) => (
              <Chip
                key={status}
                label={`Status: ${statusOptions.find(s => s.value === status)?.label}`}
                size="small"
                onDelete={() => handleStatusChange(status, false)}
              />
            ))}
            {(filters.priority || []).map((priority) => (
              <Chip
                key={priority}
                label={`Priority: ${priorityOptions.find(p => p.value === priority)?.label}`}
                size="small"
                onDelete={() => handlePriorityChange(priority, false)}
              />
            ))}
            {filters.projectId && (
              <Chip
                label={`Project: ${projects.find(p => p.id === filters.projectId)?.name || 'Unknown'}`}
                size="small"
                onDelete={() => handleProjectChange('')}
              />
            )}
            {filters.assigneeId && (
              <Chip
                label={`Assignee: ${filters.assigneeId === 'me' ? 'Me' : filters.assigneeId === 'unassigned' ? 'Unassigned' : 'Unknown'}`}
                size="small"
                onDelete={() => handleAssigneeChange('')}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TaskFilters;
