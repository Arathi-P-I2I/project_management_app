import { Router } from 'express';
import projectController from '../controllers/project.controller';
import { 
  authenticateToken, 
  requireRole
} from '../middleware/auth.middleware';
import { 
  validateCreateProject, 
  validateUpdateProject, 
  validatePagination 
} from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /projects
 * @desc    Get all projects with pagination and filtering
 * @access  Private (Admin, Manager, User)
 */
router.get('/', 
  authenticateToken, 
  validatePagination,
  projectController.getProjects
);

/**
 * @route   GET /projects/stats
 * @desc    Get project statistics
 * @access  Private (Admin, Manager)
 */
router.get('/stats', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  projectController.getProjectStats
);

/**
 * @route   GET /projects/manager/:managerId
 * @desc    Get projects by manager
 * @access  Private (Admin, Manager, or own projects)
 */
router.get('/manager/:managerId', 
  authenticateToken, 
  projectController.getProjectsByManager
);

/**
 * @route   GET /projects/:id
 * @desc    Get project by ID
 * @access  Private (Admin, Manager, or project member)
 */
router.get('/:id', 
  authenticateToken, 
  projectController.getProjectById
);

/**
 * @route   POST /projects
 * @desc    Create new project
 * @access  Private (Admin, Manager)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  validateCreateProject,
  projectController.createProject
);

/**
 * @route   PUT /projects/:id
 * @desc    Update project
 * @access  Private (Admin, Manager, or project manager)
 */
router.put('/:id', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  validateUpdateProject,
  projectController.updateProject
);

/**
 * @route   DELETE /projects/:id
 * @desc    Delete project (soft delete)
 * @access  Private (Admin, Manager)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  projectController.deleteProject
);

/**
 * @route   PATCH /projects/:id/restore
 * @desc    Restore soft-deleted project
 * @access  Private (Admin only)
 */
router.patch('/:id/restore', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  projectController.restoreProject
);

export default router; 