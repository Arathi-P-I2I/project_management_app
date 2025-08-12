import { Router } from 'express';
import taskController from '../controllers/task.controller';
import { 
  authenticateToken, 
  requireRole
} from '../middleware/auth.middleware';
import { 
  validateCreateTask, 
  validateUpdateTask, 
  validatePagination 
} from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /tasks
 * @desc    Get all tasks with pagination and filtering
 * @access  Private (Admin, Manager, User)
 */
router.get('/', 
  authenticateToken, 
  validatePagination,
  taskController.getTasks
);

/**
 * @route   GET /tasks/stats
 * @desc    Get task statistics
 * @access  Private (Admin, Manager)
 */
router.get('/stats', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  taskController.getTaskStats
);

/**
 * @route   GET /tasks/assignee/:assigneeId
 * @desc    Get tasks by assignee
 * @access  Private (Admin, Manager, or own tasks)
 */
router.get('/assignee/:assigneeId', 
  authenticateToken, 
  taskController.getTasksByAssignee
);

/**
 * @route   GET /tasks/project/:projectId
 * @desc    Get tasks by project
 * @access  Private (Admin, Manager, or project member)
 */
router.get('/project/:projectId', 
  authenticateToken, 
  taskController.getTasksByProject
);

/**
 * @route   GET /tasks/:id
 * @desc    Get task by ID
 * @access  Private (Admin, Manager, or task assignee)
 */
router.get('/:id', 
  authenticateToken, 
  taskController.getTaskById
);

/**
 * @route   POST /tasks
 * @desc    Create new task
 * @access  Private (Admin, Manager)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  validateCreateTask,
  taskController.createTask
);

/**
 * @route   PUT /tasks/:id
 * @desc    Update task
 * @access  Private (Admin, Manager, or task assignee)
 */
router.put('/:id', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  validateUpdateTask,
  taskController.updateTask
);

/**
 * @route   DELETE /tasks/:id
 * @desc    Delete task (hard delete with cascade)
 * @access  Private (Admin, Manager)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  taskController.deleteTask
);

export default router; 