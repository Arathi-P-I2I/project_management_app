import { Request, Response } from 'express';
import authService, { LoginCredentials, RegisterData } from '../services/auth.service';
import { logError, logAuth } from '../config/logger';

export class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role }: RegisterData = req.body;

      // Basic validation
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'Email, password, firstName, and lastName are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        });
        return;
      }

      // Password strength validation
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
          code: 'WEAK_PASSWORD'
        });
        return;
      }

      // Create user
      const user = await authService.registerUser({
        email,
        password,
        firstName,
        lastName,
        ...(role && { role })
      });

      // Generate tokens
      const tokens = authService.generateAuthTokens(user);

      logAuth('User registered successfully', user.id, true, {
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt
          },
          tokens
        }
      });
    } catch (error) {
      logError('User registration failed', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          code: 'USER_ALREADY_EXISTS'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed',
        code: 'REGISTRATION_FAILED'
      });
    }
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginCredentials = req.body;

      // Basic validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
        return;
      }

      // Authenticate user
      const user = await authService.authenticateUser({ email, password });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
        return;
      }

      // Generate tokens
      const tokens = authService.generateAuthTokens(user);

      logAuth('User logged in successfully', user.id, true, {
        email: user.email,
        role: user.role
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            preferences: user.preferences
          },
          tokens
        }
      });
    } catch (error) {
      logError('User login failed', error);
      
      res.status(500).json({
        success: false,
        message: 'Login failed',
        code: 'LOGIN_FAILED'
      });
    }
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          code: 'REFRESH_TOKEN_REQUIRED'
        });
        return;
      }

      // Refresh tokens
      const tokens = await authService.refreshAccessToken(refreshToken);

      logAuth('Token refreshed successfully', req.user?.userId || 'unknown', true, {
        email: req.user?.email
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens }
      });
    } catch (error) {
      logError('Token refresh failed', error);
      
      res.status(401).json({
        success: false,
        message: 'Token refresh failed',
        code: 'REFRESH_FAILED'
      });
    }
  }

  /**
   * Logout user
   * POST /auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Invalidate session
      await authService.logout(req.user.userId);

      logAuth('User logged out successfully', req.user.userId, true, {
        email: req.user.email
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logError('User logout failed', error);
      
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        code: 'LOGOUT_FAILED'
      });
    }
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Get user data
      const user = await authService.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            preferences: user.preferences,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      logError('Get profile failed', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        code: 'PROFILE_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Update user profile
   * PUT /auth/profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'First name and last name are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Update user profile
      const updatedUser = await authService.updateUserProfile(req.user.userId, {
        firstName,
        lastName
      });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      logAuth('Profile updated successfully', req.user.userId, true, {
        email: req.user.email
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          emailVerified: updatedUser.emailVerified,
          preferences: updatedUser.preferences,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      logError('Profile update failed', error);
      
      res.status(500).json({
        success: false,
        message: 'Profile update failed',
        code: 'PROFILE_UPDATE_FAILED'
      });
    }
  }

  /**
   * Update user password
   * PUT /auth/password
   */
  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
          code: 'MISSING_PASSWORD_FIELDS'
        });
        return;
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
          code: 'WEAK_PASSWORD'
        });
        return;
      }

      // Verify current password
      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      const isCurrentPasswordValid = await authService.comparePassword(
        currentPassword,
        user.password || ''
      );

      if (!isCurrentPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
        return;
      }

      // Update password
      const success = await authService.updatePassword(req.user.userId, newPassword);

      if (!success) {
        res.status(500).json({
          success: false,
          message: 'Password update failed',
          code: 'PASSWORD_UPDATE_FAILED'
        });
        return;
      }

      logAuth('Password updated successfully', req.user.userId, true, {
        email: req.user.email
      });

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      logError('Password update failed', error);
      
      res.status(500).json({
        success: false,
        message: 'Password update failed',
        code: 'PASSWORD_UPDATE_FAILED'
      });
    }
  }

  /**
   * Health check for authentication service
   * GET /auth/health
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Authentication service is healthy',
        timestamp: new Date().toISOString(),
        service: 'auth'
      });
    } catch (error) {
      logError('Auth health check failed', error);
      
      res.status(500).json({
        success: false,
        message: 'Authentication service is unhealthy',
        timestamp: new Date().toISOString(),
        service: 'auth'
      });
    }
  }
}

export default new AuthController(); 