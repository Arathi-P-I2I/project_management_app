import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logError } from '../config/logger';

// Validation schemas
const schemas = {
  // Auth validation schemas
  register: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    firstName: z.string()
      .min(2, 'First name must be at least 2 characters long')
      .max(50, 'First name cannot exceed 50 characters'),
    lastName: z.string()
      .min(2, 'Last name must be at least 2 characters long')
      .max(50, 'Last name cannot exceed 50 characters'),
    role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional()
  }),

  login: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  // Project validation schemas
  createProject: z.object({
    name: z.string()
      .min(3, 'Project name must be at least 3 characters long')
      .max(100, 'Project name cannot exceed 100 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    managerId: z.string().optional(),
    teamMembers: z.union([z.array(z.string()), z.string()]).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    settings: z.record(z.any()).optional()
  }),

  updateProject: z.object({
    name: z.string()
      .min(3, 'Project name must be at least 3 characters long')
      .max(100, 'Project name cannot exceed 100 characters')
      .optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    managerId: z.string().optional(),
    teamMembers: z.union([z.array(z.string()), z.string()]).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    settings: z.record(z.any()).optional()
  }),

  // Task validation schemas
  createTask: z.object({
    title: z.string()
      .min(3, 'Task title must be at least 3 characters long')
      .max(200, 'Task title cannot exceed 200 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    assigneeId: z.string().optional(),
    projectId: z.string().optional(),
    estimatedHours: z.number().positive().optional(),
    dueDate: z.string().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    attachments: z.array(z.string()).optional()
  }),

  updateTask: z.object({
    title: z.string()
      .min(3, 'Task title must be at least 3 characters long')
      .max(200, 'Task title cannot exceed 200 characters')
      .optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    assigneeId: z.string().optional(),
    projectId: z.string().optional(),
    estimatedHours: z.number().positive().optional(),
    dueDate: z.string().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    attachments: z.array(z.string()).optional()
  }),

  // User validation schemas
  updateProfile: z.object({
    firstName: z.string()
      .min(2, 'First name must be at least 2 characters long')
      .max(50, 'First name cannot exceed 50 characters')
      .optional(),
    lastName: z.string()
      .min(2, 'Last name must be at least 2 characters long')
      .max(50, 'Last name cannot exceed 50 characters')
      .optional(),
    email: z.string().email('Please provide a valid email address').optional(),
    avatar: z.string().url('Avatar URL must be a valid URL').optional(),
    preferences: z.record(z.any()).optional()
  }),

  // Query parameter validation schemas
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().min(1).optional(),
    status: z.union([
      z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
      z.array(z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']))
    ]).optional(),
    priority: z.union([
      z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']))
    ]).optional(),
    managerId: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'title', 'status', 'priority']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
};

// Validation middleware factory
export const validate = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logError('Validation schema not found', new Error(`Schema '${schemaName}' not found`));
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'VALIDATION_SCHEMA_NOT_FOUND'
      });
      return;
    }

    const dataToValidate = req.method === 'GET' ? req.query : req.body;
    
    try {
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the request data with validated data
      if (req.method === 'GET') {
        // For query parameters, we need to ensure all values are strings
        const stringifiedData: Record<string, any> = {};
        Object.entries(validatedData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            stringifiedData[key] = value.map(v => String(v));
          } else {
            stringifiedData[key] = String(value);
          }
        });
        req.query = stringifiedData;
      } else {
        req.body = validatedData;
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.code
        }));

        logError('Validation failed', error, {
          schema: schemaName,
          errors: validationErrors
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: validationErrors
        });
        return;
      }
      
      // Handle unexpected errors
      logError('Unexpected validation error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

// Export individual validation functions for convenience
export const validateRegister = validate('register');
export const validateLogin = validate('login');
export const validateCreateProject = validate('createProject');
export const validateUpdateProject = validate('updateProject');
export const validateCreateTask = validate('createTask');
export const validateUpdateTask = validate('updateTask');
export const validateUpdateProfile = validate('updateProfile');
export const validatePagination = validate('pagination');

export default {
  validate,
  validateRegister,
  validateLogin,
  validateCreateProject,
  validateUpdateProject,
  validateCreateTask,
  validateUpdateTask,
  validateUpdateProfile,
  validatePagination
}; 