import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logError, logAuth } from '../config/logger';

const prisma = new PrismaClient();

export class TaskController {
  /**
   * Get all tasks (with pagination and filtering)
   * GET /tasks
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status, priority, assigneeId, projectId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (assigneeId) {
        where.assigneeId = assigneeId;
      }

      if (projectId) {
        where.projectId = projectId;
      }

      // Get tasks with pagination
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            },
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            },
            parentTask: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            _count: {
              select: {
                subtasks: true,
                comments: true,
                files: true,
                timeEntries: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.task.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: {
          tasks,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages
          }
        }
      });
    } catch (error) {
      logError('Get tasks failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tasks',
        code: 'TASKS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Get task by ID
   * GET /tasks/:id
   */
  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Task ID is required',
          code: 'TASK_ID_REQUIRED'
        });
        return;
      }

      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          parentTask: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              assigneeId: true,
              dueDate: true
            }
          },
          _count: {
            select: {
              subtasks: true,
              comments: true,
              files: true,
              timeEntries: true
            }
          }
        }
      });

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        data: { task }
      });
    } catch (error) {
      logError('Get task by ID failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve task',
        code: 'TASK_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Create new task
   * POST /tasks
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { 
        title, 
        description, 
        status, 
        priority, 
        assigneeId, 
        projectId, 
        parentTaskId, 
        estimatedHours, 
        dueDate, 
        tags 
      } = req.body;

      // Validate required fields
      if (!title || !projectId) {
        res.status(400).json({
          success: false,
          message: 'Task title and project ID are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        res.status(400).json({
          success: false,
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      // Check if assignee exists (if provided)
      if (assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId }
        });

        if (!assignee) {
          res.status(400).json({
            success: false,
            message: 'Assignee not found',
            code: 'ASSIGNEE_NOT_FOUND'
          });
          return;
        }
      }

      // Check if parent task exists (if provided)
      if (parentTaskId) {
        const parentTask = await prisma.task.findUnique({
          where: { id: parentTaskId }
        });

        if (!parentTask) {
          res.status(400).json({
            success: false,
            message: 'Parent task not found',
            code: 'PARENT_TASK_NOT_FOUND'
          });
          return;
        }

        // Ensure parent task is in the same project
        if (parentTask.projectId !== projectId) {
          res.status(400).json({
            success: false,
            message: 'Parent task must be in the same project',
            code: 'PARENT_TASK_PROJECT_MISMATCH'
          });
          return;
        }
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || 'TODO',
          priority: priority || 'MEDIUM',
          assigneeId,
          projectId,
          parentTaskId,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          tags: tags || []
        },
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          parentTask: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      });

      logAuth('Task created successfully', task.id, true, {
        createdBy: (req as any).user?.userId || 'unknown',
        taskTitle: task.title,
        projectId: task.projectId
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task }
      });
    } catch (error) {
      logError('Create task failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task',
        code: 'TASK_CREATION_FAILED'
      });
    }
  }

  /**
   * Update task
   * PUT /tasks/:id
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        title, 
        description, 
        status, 
        priority, 
        assigneeId, 
        projectId, 
        parentTaskId, 
        estimatedHours, 
        actualHours, 
        dueDate, 
        tags 
      } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Task ID is required',
          code: 'TASK_ID_REQUIRED'
        });
        return;
      }

      // Check if task exists
      const existingTask = await prisma.task.findUnique({
        where: { id }
      });

      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        });
        return;
      }

      // Check if new assignee exists (if provided)
      if (assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId }
        });

        if (!assignee) {
          res.status(400).json({
            success: false,
            message: 'Assignee not found',
            code: 'ASSIGNEE_NOT_FOUND'
          });
          return;
        }
      }

      // Check if new parent task exists (if provided)
      if (parentTaskId) {
        const parentTask = await prisma.task.findUnique({
          where: { id: parentTaskId }
        });

        if (!parentTask) {
          res.status(400).json({
            success: false,
            message: 'Parent task not found',
            code: 'PARENT_TASK_NOT_FOUND'
          });
          return;
        }

        // Prevent circular dependencies
        if (parentTaskId === id) {
          res.status(400).json({
            success: false,
            message: 'Task cannot be its own parent',
            code: 'CIRCULAR_DEPENDENCY'
          });
          return;
        }

        // Ensure parent task is in the same project
        if (parentTask.projectId !== existingTask.projectId) {
          res.status(400).json({
            success: false,
            message: 'Parent task must be in the same project',
            code: 'PARENT_TASK_PROJECT_MISMATCH'
          });
          return;
        }
      }

      // Update task
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(assigneeId !== undefined && { assigneeId }),
          ...(projectId && { projectId }),
          ...(parentTaskId !== undefined && { parentTaskId }),
          ...(estimatedHours !== undefined && { estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null }),
          ...(actualHours !== undefined && { actualHours: parseFloat(actualHours) }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(tags && { tags })
        },
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          parentTask: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      });

      logAuth('Task updated successfully', id, true, {
        updatedBy: (req as any).user?.userId || 'unknown',
        updatedFields: Object.keys(req.body)
      });

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: { task: updatedTask }
      });
    } catch (error) {
      logError('Update task failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task',
        code: 'TASK_UPDATE_FAILED'
      });
    }
  }

  /**
   * Delete task
   * DELETE /tasks/:id
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Task ID is required',
          code: 'TASK_ID_REQUIRED'
        });
        return;
      }

      // Check if task exists
      const existingTask = await prisma.task.findUnique({
        where: { id }
      });

      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        });
        return;
      }

      // Check if task has subtasks
      const subtasks = await prisma.task.count({
        where: { parentTaskId: id }
      });

      if (subtasks > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete task with subtasks',
          code: 'TASK_HAS_SUBTASKS'
        });
        return;
      }

      // Check if task has active time entries
      const activeTimeEntries = await prisma.timeEntry.count({
        where: {
          taskId: id,
          endTime: null
        }
      });

      if (activeTimeEntries > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete task with active time entries',
          code: 'TASK_HAS_ACTIVE_TIME_ENTRIES'
        });
        return;
      }

      // Delete task (cascade will handle related records)
      await prisma.task.delete({
        where: { id }
      });

      logAuth('Task deleted successfully', id, true, {
        deletedBy: (req as any).user?.userId || 'unknown',
        taskTitle: existingTask.title
      });

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      logError('Delete task failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task',
        code: 'TASK_DELETION_FAILED'
      });
    }
  }

  /**
   * Get task statistics
   * GET /tasks/stats
   */
  async getTaskStats(_req: Request, res: Response): Promise<void> {
    try {
      const [totalTasks, completedTasks, inProgressTasks, statusStats, priorityStats] = await Promise.all([
        prisma.task.count(),
        prisma.task.count({ where: { status: 'DONE' } }),
        prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.task.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.task.groupBy({
          by: ['priority'],
          _count: { priority: true }
        })
      ]);

      const stats = {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: totalTasks - completedTasks - inProgressTasks,
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
        message: 'Task statistics retrieved successfully',
        data: { stats }
      });
    } catch (error) {
      logError('Get task stats failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve task statistics',
        code: 'TASK_STATS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Get tasks by assignee
   * GET /tasks/assignee/:assigneeId
   */
  async getTasksByAssignee(req: Request, res: Response): Promise<void> {
    try {
      const { assigneeId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (!assigneeId) {
        res.status(400).json({
          success: false,
          message: 'Assignee ID is required',
          code: 'ASSIGNEE_ID_REQUIRED'
        });
        return;
      }

      // Check if assignee exists
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        res.status(404).json({
          success: false,
          message: 'Assignee not found',
          code: 'ASSIGNEE_NOT_FOUND'
        });
        return;
      }

      // Build where clause
      const where: any = { assigneeId };
      if (status) {
        where.status = status;
      }

      // Get tasks
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            },
            parentTask: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            _count: {
              select: {
                subtasks: true,
                comments: true,
                files: true,
                timeEntries: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.task.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: {
          tasks,
          assignee: {
            id: assignee.id,
            firstName: assignee.firstName,
            lastName: assignee.lastName,
            email: assignee.email,
            avatarUrl: assignee.avatarUrl
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
      logError('Get tasks by assignee failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tasks',
        code: 'TASKS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Get tasks by project
   * GET /tasks/project/:projectId
   */
  async getTasksByProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 10, status, priority } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (!projectId) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
          code: 'PROJECT_ID_REQUIRED'
        });
        return;
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      // Build where clause
      const where: any = { projectId };
      if (status) {
        where.status = status;
      }
      if (priority) {
        where.priority = priority;
      }

      // Get tasks
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            },
            parentTask: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            _count: {
              select: {
                subtasks: true,
                comments: true,
                files: true,
                timeEntries: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.task.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: {
          tasks,
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status
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
      logError('Get tasks by project failed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tasks',
        code: 'TASKS_RETRIEVAL_FAILED'
      });
    }
  }
}

export default new TaskController(); 