import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { 
  authenticateToken, 
  authenticateRefreshToken, 
  authRateLimit 
} from '../middleware/auth.middleware';
import { validateRegister, validateLogin } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRateLimit, validateRegister, authController.register);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authRateLimit, validateLogin, authController.login);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public (but requires valid refresh token)
 */
router.post('/refresh', authenticateRefreshToken, authController.refreshToken);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getProfile);

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * @route   PUT /auth/password
 * @desc    Update user password
 * @access  Private
 */
router.put('/password', authenticateToken, authController.updatePassword);

/**
 * @route   GET /auth/health
 * @desc    Health check for authentication service
 * @access  Public
 */
router.get('/health', authController.healthCheck);

export default router; 