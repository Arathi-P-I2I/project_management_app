import apiService from './api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  managerId: string;
  teamMembers: string[];
  tags: string[];
  settings: Record<string, any>;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  status?: string[];
  priority?: string[];
  managerId?: string;
  search?: string;
}

export interface ProjectResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectStats {
  total: number;
  planning: number;
  inProgress: number;
  completed: number;
  onHold: number;
  cancelled: number;
  averageProgress: number;
}

class ProjectService {
  async getProjects(filters: ProjectFilters = {}): Promise<ProjectResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) filters.status.forEach(s => params.append('status', s));
    if (filters.priority) filters.priority.forEach(p => params.append('priority', p));
    if (filters.managerId) params.append('managerId', filters.managerId);
    if (filters.search) params.append('search', filters.search);

    const url = `/projects?${params.toString()}`;

    const response = await apiService.get<{ data: ProjectResponse }>(url);
    return response.data;
  }

  async getProjectById(id: string): Promise<Project> {
    const response = await apiService.get<{ data: { project: Project } }>(`/projects/${id}`);
    return response.data.project;
  }

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const response = await apiService.post<{ data: { project: Project } }>('/projects', projectData);
    return response.data.project;
  }

  async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
    const response = await apiService.put<{ data: { project: Project } }>(`/projects/${id}`, projectData);
    return response.data.project;
  }

  async deleteProject(id: string): Promise<void> {
    return apiService.delete<void>(`/projects/${id}`);
  }

  async getProjectStats(): Promise<ProjectStats> {
    const response = await apiService.get<{ data: { stats: ProjectStats } }>('/projects/stats');
    return response.data.stats;
  }

  async getProjectsByManager(managerId: string): Promise<ProjectResponse> {
    const response = await apiService.get<{ data: ProjectResponse }>(`/projects/manager/${managerId}`);
    return response.data;
  }

  async addProjectMember(projectId: string, userId: string, role: string): Promise<void> {
    return apiService.post<void>(`/projects/${projectId}/members`, { userId, role });
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    return apiService.delete<void>(`/projects/${projectId}/members/${userId}`);
  }

  async updateProjectMemberRole(projectId: string, userId: string, role: string): Promise<void> {
    return apiService.put<void>(`/projects/${projectId}/members/${userId}`, { role });
  }
}

export const projectService = new ProjectService();
export default projectService; 