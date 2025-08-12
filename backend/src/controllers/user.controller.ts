import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logError, logAuth } from '../config/logger';

const prisma = new PrismaClient();

export class UserController {
  /**
   * Get all users (with pagination and filtering)
   * GET /users
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (role) {
        where.role = role;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            avatarUrl: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages
          }
        }
      });
    } catch (error) {
      logError('Get users failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        code: 'USERS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Get user by ID
   * GET /users/:id
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          code: 'USER_ID_REQUIRED'
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          preferences: true,
          isActive: true,
          emailVerified: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

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
        message: 'User retrieved successfully',
        data: { user }
      });
    } catch (error) {
      logError('Get user by ID failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        code: 'USER_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Update user
   * PUT /users/:id
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, role, isActive, preferences } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          code: 'USER_ID_REQUIRED'
        });
        return;
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(role && { role }),
          ...(isActive !== undefined && { isActive }),
          ...(preferences && { preferences })
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          preferences: true,
          isActive: true,
          emailVerified: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logAuth('User updated successfully', id, true, {
        updatedBy: (req as any).user?.userId || 'unknown',
        updatedFields: Object.keys(req.body)
      });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      logError('Update user failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        code: 'USER_UPDATE_FAILED'
      });
    }
  }

  /**
   * Delete user
   * DELETE /users/:id
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          code: 'USER_ID_REQUIRED'
        });
        return;
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Prevent self-deletion
      if (id === (req as any).user?.userId) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
          code: 'SELF_DELETION_NOT_ALLOWED'
        });
        return;
      }

      // Soft delete by setting isActive to false
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      logAuth('User deleted successfully', id, true, {
        deletedBy: (req as any).user?.userId || 'unknown'
      });

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logError('Delete user failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        code: 'USER_DELETION_FAILED'
      });
    }
  }

  /**
   * Get user statistics
   * GET /users/stats
   */
  async getUserStats(_req: Request, res: Response): Promise<void> {
    try {
      const [totalUsers, activeUsers, verifiedUsers, roleStats] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        })
      ]);

      const stats = {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        inactive: totalUsers - activeUsers,
        unverified: totalUsers - verifiedUsers,
        roles: roleStats.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.role] = stat._count.role;
          return acc;
        }, {} as Record<string, number>)
      };

      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: { stats }
      });
    } catch (error) {
      logError('Get user stats failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics',
        code: 'USER_STATS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Update user avatar
   * PUT /users/:id/avatar
   */
  async updateUserAvatar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { avatarUrl } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          code: 'USER_ID_REQUIRED'
        });
        return;
      }

      if (!avatarUrl) {
        res.status(400).json({
          success: false,
          message: 'Avatar URL is required',
          code: 'AVATAR_URL_REQUIRED'
        });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { avatarUrl },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true
        }
      });

      logAuth('User avatar updated successfully', id, true, {
        updatedBy: (req as any).user?.userId || 'unknown'
      });

      res.status(200).json({
        success: true,
        message: 'User avatar updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      logError('Update user avatar failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user avatar',
        code: 'AVATAR_UPDATE_FAILED'
      });
    }
  }
}

export default new UserController(); 