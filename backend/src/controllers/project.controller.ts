import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logError, logAuth } from '../config/logger';

const prisma = new PrismaClient();

export class ProjectController {
  /**
   * Get all projects (with pagination and filtering)
   * GET /projects
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status, priority, managerId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      // Build where clause
      const where: any = {};
      
      // Only show non-deleted projects
      (where as any).isDeleted = false;
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        if (Array.isArray(status)) {
          where.status = { in: status };
        } else {
          where.status = status;
        }
      }

      if (priority) {
        if (Array.isArray(priority)) {
          where.priority = { in: priority };
        } else {
          where.priority = priority;
        }
      }

      if (managerId) {
        where.managerId = managerId;
      }



      // Get projects with pagination
      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            },
            _count: {
              select: {
                tasks: true,
                milestones: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.project.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Projects retrieved successfully',
        data: {
          projects,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages
          }
        }
      });
    } catch (error) {
      logError('Get projects failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve projects',
        code: 'PROJECTS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Get project by ID
   * GET /projects/:id
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
          code: 'PROJECT_ID_REQUIRED'
        });
        return;
      }

      const project = await prisma.project.findFirst({
        where: { 
          id,
          isDeleted: false
        } as any,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              assigneeId: true,
              dueDate: true
            }
          },
          milestones: {
            select: {
              id: true,
              name: true,
              dueDate: true,
              completedAt: true
            }
          },
          _count: {
            select: {
              tasks: true,
              milestones: true,
              comments: true,
              files: true
            }
          }
        }
      });

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Project retrieved successfully',
        data: { project }
      });
    } catch (error) {
      logError('Get project by ID failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve project',
        code: 'PROJECT_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Create new project
   * POST /projects
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { 
        name, 
        description, 
        status, 
        priority, 
        startDate, 
        endDate, 
        managerId, 
        teamMembers, 
        tags, 
        settings 
      } = req.body;

      // Validate required fields
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Project name is required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Use the authenticated user as manager if not provided
      const projectManagerId = managerId || (req as any).user?.userId;
      
      if (!projectManagerId) {
        res.status(400).json({
          success: false,
          message: 'Manager ID is required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Check if manager exists
      const manager = await prisma.user.findUnique({
        where: { id: projectManagerId }
      });

      if (!manager) {
        res.status(400).json({
          success: false,
          message: 'Manager not found',
          code: 'MANAGER_NOT_FOUND'
        });
        return;
      }

             // Create project
       const project = await prisma.project.create({
         data: {
           name,
           description,
           status: status || 'ACTIVE',
           priority: priority || 'MEDIUM',
           startDate: startDate ? new Date(startDate) : null,
           endDate: endDate ? new Date(endDate) : null,
           managerId: projectManagerId,
           teamMembers: teamMembers || [],
           tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : []),
           settings: settings || {}
         },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      });

      logAuth('Project created successfully', project.id, true, {
        createdBy: (req as any).user?.userId || 'unknown',
        projectName: project.name
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project }
      });
    } catch (error) {
      logError('Create project failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project',
        code: 'PROJECT_CREATION_FAILED'
      });
    }
  }

  /**
   * Update project
   * PUT /projects/:id
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        name, 
        description, 
        status, 
        priority, 
        startDate, 
        endDate, 
        managerId, 
        teamMembers, 
        tags, 
        settings 
      } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
          code: 'PROJECT_ID_REQUIRED'
        });
        return;
      }

      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { id }
      });

      if (!existingProject) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      // Check if new manager exists (if provided)
      if (managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: managerId }
        });

        if (!manager) {
          res.status(400).json({
            success: false,
            message: 'Manager not found',
            code: 'MANAGER_NOT_FOUND'
          });
          return;
        }
      }

             // Update project
       const updatedProject = await prisma.project.update({
         where: { id },
         data: {
           ...(name && { name }),
           ...(description !== undefined && { description }),
           ...(status && { status }),
           ...(priority && { priority }),
           ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
           ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
           ...(managerId && { managerId }),
           ...(teamMembers && { teamMembers }),
           ...(tags && { tags: Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) }),
           ...(settings && { settings })
         },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      });

      logAuth('Project updated successfully', id, true, {
        updatedBy: (req as any).user?.userId || 'unknown',
        updatedFields: Object.keys(req.body)
      });

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: { project: updatedProject }
      });
    } catch (error) {
      logError('Update project failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project',
        code: 'PROJECT_UPDATE_FAILED'
      });
    }
  }

  /**
   * Delete project (Soft Delete)
   * DELETE /projects/:id
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
          code: 'PROJECT_ID_REQUIRED'
        });
        return;
      }

      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { id }
      });

      if (!existingProject) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      // Check if project has active tasks
      const activeTasks = await prisma.task.count({
        where: {
          projectId: id,
          status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] }
        }
      });

      if (activeTasks > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete project with active tasks',
          code: 'PROJECT_HAS_ACTIVE_TASKS'
        });
        return;
      }

      // Soft delete project
      await prisma.project.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: (req as any).user?.userId || 'unknown'
        } as any
      });

      logAuth('Project soft deleted successfully', id, true, {
        deletedBy: (req as any).user?.userId || 'unknown',
        projectName: existingProject.name
      });

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      logError('Delete project failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        code: 'PROJECT_DELETION_FAILED'
      });
    }
  }

  /**
   * Get project statistics
   * GET /projects/stats
   */
  async getProjectStats(_req: Request, res: Response): Promise<void> {
    try {
      const [totalProjects, activeProjects, completedProjects, statusStats, priorityStats] = await Promise.all([
        prisma.project.count({ where: { isDeleted: false } as any }),
        prisma.project.count({ where: { status: 'ACTIVE', isDeleted: false } as any }),
        prisma.project.count({ where: { status: 'COMPLETED', isDeleted: false } as any }),
        prisma.project.groupBy({
          by: ['status'],
          where: { isDeleted: false } as any,
          _count: { status: true }
        }),
        prisma.project.groupBy({
          by: ['priority'],
          where: { isDeleted: false } as any,
          _count: { priority: true }
        })
      ]);

      const stats = {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        onHold: totalProjects - activeProjects - completedProjects,
        status: statusStats.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        priority: priorityStats.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.priority] = stat._count.priority;
          return acc;
        }, {} as Record<string, number>)
      };

      res.status(200).json({
        success: true,
        message: 'Project statistics retrieved successfully',
        data: { stats }
      });
    } catch (error) {
      logError('Get project stats failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve project statistics',
        code: 'PROJECT_STATS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Get projects by manager
   * GET /projects/manager/:managerId
   */
  async getProjectsByManager(req: Request, res: Response): Promise<void> {
    try {
      const { managerId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (!managerId) {
        res.status(400).json({
          success: false,
          message: 'Manager ID is required',
          code: 'MANAGER_ID_REQUIRED'
        });
        return;
      }

      // Check if manager exists
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      });

      if (!manager) {
        res.status(404).json({
          success: false,
          message: 'Manager not found',
          code: 'MANAGER_NOT_FOUND'
        });
        return;
      }

      // Build where clause
      const where: any = { 
        managerId,
        isDeleted: false // Only show non-deleted projects
      };
      if (status) {
        where.status = status;
      }

      // Get projects
      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            _count: {
              select: {
                tasks: true,
                milestones: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.project.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Projects retrieved successfully',
        data: {
          projects,
          manager: {
            id: manager.id,
            firstName: manager.firstName,
            lastName: manager.lastName,
            email: manager.email,
            avatarUrl: manager.avatarUrl
          },
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages
          }
        }
      });
    } catch (error) {
      logError('Get projects by manager failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve projects',
        code: 'PROJECTS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Restore soft-deleted project
   * PATCH /projects/:id/restore
   */
  async restoreProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
          code: 'PROJECT_ID_REQUIRED'
        });
        return;
      }

      // Check if project exists and is deleted
      const existingProject = await prisma.project.findFirst({
        where: { 
          id,
          isDeleted: true
        } as any
      });

      if (!existingProject) {
        res.status(404).json({
          success: false,
          message: 'Deleted project not found',
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      // Restore project
      const restoredProject = await prisma.project.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null
        } as any,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      });

      logAuth('Project restored successfully', id, true, {
        restoredBy: (req as any).user?.userId || 'unknown',
        projectName: restoredProject.name
      });

      res.status(200).json({
        success: true,
        message: 'Project restored successfully',
        data: { project: restoredProject }
      });
    } catch (error) {
      logError('Restore project failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore project',
        code: 'PROJECT_RESTORE_FAILED'
      });
    }
  }
}

export default new ProjectController(); 