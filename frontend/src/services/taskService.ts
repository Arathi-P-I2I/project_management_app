import apiService from './api';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId: string | null;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  parentTaskId: string | null;
  estimatedHours: number | null;
  actualHours: number;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  projectId?: string;
  search?: string;
}

export interface TaskResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  completed: number;
  cancelled: number;
  overdue: number;
  averageCompletionTime: number;
}

class TaskService {
  async getTasks(filters: TaskFilters = {}): Promise<TaskResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) filters.status.forEach(s => params.append('status', s));
    if (filters.priority) filters.priority.forEach(p => params.append('priority', p));
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.search) params.append('search', filters.search);

    const response = await apiService.get<{ data: TaskResponse }>(`/tasks?${params.toString()}`);
    return response.data;
  }

  async getTaskById(id: string): Promise<Task> {
    const response = await apiService.get<{ data: { task: Task } }>(`/tasks/${id}`);
    return response.data.task;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await apiService.post<{ data: { task: Task } }>('/tasks', taskData);
    return response.data.task;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await apiService.put<{ data: { task: Task } }>(`/tasks/${id}`, taskData);
    return response.data.task;
  }

  async deleteTask(id: string): Promise<void> {
    return apiService.delete<void>(`/tasks/${id}`);
  }

  async getTaskStats(): Promise<TaskStats> {
    const response = await apiService.get<{ data: { stats: TaskStats } }>('/tasks/stats');
    return response.data.stats;
  }

  async getTasksByProject(projectId: string): Promise<TaskResponse> {
    const response = await apiService.get<{ data: TaskResponse }>(`/tasks/project/${projectId}`);
    return response.data;
  }

  async getTasksByAssignee(assigneeId: string): Promise<TaskResponse> {
    const response = await apiService.get<{ data: TaskResponse }>(`/tasks/assignee/${assigneeId}`);
    return response.data;
  }

  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    const response = await apiService.patch<{ data: { task: Task } }>(`/tasks/${id}/status`, { status });
    return response.data.task;
  }

  async assignTask(id: string, assigneeId: string): Promise<Task> {
    const response = await apiService.patch<{ data: { task: Task } }>(`/tasks/${id}/assign`, { assigneeId });
    return response.data.task;
  }

  async addTaskAttachment(id: string, file: File): Promise<{ id: string; name: string; url: string; size: number }> {
    return apiService.uploadFile(`/tasks/${id}/attachments`, file);
  }

  async removeTaskAttachment(taskId: string, attachmentId: string): Promise<void> {
    return apiService.delete<void>(`/tasks/${taskId}/attachments/${attachmentId}`);
  }

  async addTaskComment(taskId: string, comment: string): Promise<void> {
    return apiService.post<void>(`/tasks/${taskId}/comments`, { comment });
  }

  async getTaskComments(taskId: string): Promise<Array<{ id: string; comment: string; userId: string; createdAt: string }>> {
    return apiService.get<Array<{ id: string; comment: string; userId: string; createdAt: string }>>(`/tasks/${taskId}/comments`);
  }
}

export const taskService = new TaskService();
export default taskService; 