import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { logError, logAuth } from '../config/logger';

const prisma = new PrismaClient();

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly saltRounds: number;

  constructor() {
    this.jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret-change-in-production';
    this.jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret-change-in-production';
    this.accessTokenExpiry = process.env['JWT_EXPIRES_IN'] || '15m';
    this.refreshTokenExpiry = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';
    this.saltRounds = parseInt(process.env['BCRYPT_ROUNDS'] || '12');
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      logError('Password hashing failed', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare a password with its hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logError('Password comparison failed', error);
      return false;
    }
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(payload: JWTPayload): string {
    try {
      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'project-management-api',
        audience: 'project-management-client'
      } as any);
    } catch (error) {
      logError('Access token generation failed', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(payload: JWTPayload): string {
    try {
      return jwt.sign(payload, this.jwtRefreshSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'project-management-api',
        audience: 'project-management-client'
      } as any);
    } catch (error) {
      logError('Refresh token generation failed', error);
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Verify and decode JWT access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'project-management-api',
        audience: 'project-management-client'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      logError('Access token verification failed', error);
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify and decode JWT refresh token
   */
  verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'project-management-api',
        audience: 'project-management-client'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      logError('Refresh token verification failed', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(credentials: LoginCredentials): Promise<any | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user || !user.isActive) {
        logAuth('Login attempt failed - user not found or inactive', 'unknown', false, { email: credentials.email });
        return null;
      }

      // Note: In a real application, you would store hashed passwords
      // For now, we'll use a simple comparison since our seed data doesn't have hashed passwords
      const isValidPassword = await this.comparePassword(credentials.password, user.password || '');
      
      if (!isValidPassword) {
        logAuth('Login attempt failed - invalid password', 'unknown', false, { email: credentials.email });
        return null;
      }

      logAuth('User authenticated successfully', user.id, true, { email: user.email });
      return user;
    } catch (error) {
      logError('Authentication failed', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Register a new user
   */
  async registerUser(userData: RegisterData): Promise<any> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash the password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create the user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: (userData.role as any) || 'USER',
          permissions: userData.role === 'ADMIN' ? ['*'] : ['project:read', 'task:read', 'task:update'],
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          },
          isActive: true,
          emailVerified: false
        }
      });

      logAuth('User registered successfully', user.id, true, { email: user.email });
      return user;
    } catch (error) {
      logError('User registration failed', error);
      throw error;
    }
  }

  /**
   * Generate authentication tokens for a user
   */
  generateAuthTokens(user: any): AuthTokens {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : []
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Convert expiry time to seconds
    const expiresIn = this.parseExpiryTime(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      
      // Get the latest user data
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return this.generateAuthTokens(user);
    } catch (error) {
      logError('Token refresh failed', error);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Parse expiry time string to seconds
   */
  private parseExpiryTime(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 15 * 60; // Default to 15 minutes
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any | null> {
    try {
      return await prisma.user.findUnique({
        where: { id: userId }
      });
    } catch (error) {
      logError('Get user by ID failed', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: { firstName: string; lastName: string }): Promise<any | null> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          updatedAt: new Date()
        }
      });

      logAuth('Profile updated successfully', userId, true);
      return updatedUser;
    } catch (error) {
      logError('Profile update failed', error);
      return null;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await this.hashPassword(newPassword);
      
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      logAuth('Password updated successfully', userId, true);
      return true;
    } catch (error) {
      logError('Password update failed', error);
      return false;
    }
  }

  /**
   * Invalidate user session (logout)
   */
  async logout(userId: string): Promise<void> {
    try {
      // In a real application, you might want to store refresh tokens in a database
      // and invalidate them here. For now, we'll just log the logout.
      logAuth('User logged out', userId, true);
    } catch (error) {
      logError('Logout failed', error);
    }
  }
}

export default new AuthService(); 