import { Router } from 'express';
import userController from '../controllers/user.controller';
import { 
  authenticateToken, 
  requireRole
} from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin, Manager)
 */
router.get('/', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER']), 
  userController.getUsers
);

/**
 * @route   GET /users/stats
 * @desc    Get user statistics
 * @access  Private (Admin)
 */
router.get('/stats', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  userController.getUserStats
);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (Admin, Manager, or own profile)
 */
router.get('/:id', 
  authenticateToken, 
  userController.getUserById
);

/**
 * @route   PUT /users/:id
 * @desc    Update user
 * @access  Private (Admin, Manager, or own profile)
 */
router.put('/:id', 
  authenticateToken, 
  userController.updateUser
);

/**
 * @route   DELETE /users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  userController.deleteUser
);

/**
 * @route   PUT /users/:id/avatar
 * @desc    Update user avatar
 * @access  Private (Admin, Manager, or own profile)
 */
router.put('/:id/avatar', 
  authenticateToken, 
  userController.updateUserAvatar
);

export default router; 