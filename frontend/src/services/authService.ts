import apiService from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
    createdAt: string;
    updatedAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RefreshTokenResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<{ success: boolean; data: AuthResponse }>('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    return apiService.post<void>('/auth/logout');
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiService.post<{ success: boolean; data: RefreshTokenResponse }>('/auth/refresh', { refreshToken });
    return response.data;
  }

  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await apiService.get<{ success: boolean; data: AuthResponse['user'] }>('/auth/me');
    return response.data;
  }

  async updateProfile(userData: Partial<AuthResponse['user']>): Promise<AuthResponse['user']> {
    const response = await apiService.put<{ success: boolean; data: AuthResponse['user'] }>('/auth/profile', userData);
    return response.data;
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    return apiService.put<void>('/auth/password', passwordData);
  }

  async forgotPassword(email: string): Promise<void> {
    return apiService.post<void>('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return apiService.post<void>('/auth/reset-password', { token, newPassword });
  }
}

export const authService = new AuthService();
export default authService; 