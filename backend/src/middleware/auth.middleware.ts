import { Request, Response, NextFunction } from 'express';
import authService, { JWTPayload } from '../services/auth.service';
import { logAuth, logSecurity } from '../config/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT access token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logSecurity('Authentication failed - no token provided', 'high', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        code: 'TOKEN_REQUIRED'
      });
      return;
    }

    // Verify the token
    const payload = authService.verifyAccessToken(token);
    
    // Add user info to request
    req.user = payload;
    
    logAuth('Token authenticated successfully', payload.userId, true, {
      email: payload.email,
      path: req.path
    });

    next();
  } catch (error) {
    logSecurity('Authentication failed - invalid token', 'high', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware to authenticate refresh token
 */
export const authenticateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logSecurity('Refresh token authentication failed - no token provided', 'high', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(401).json({
        success: false,
        message: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
      return;
    }

    // Verify the refresh token
    const payload = authService.verifyRefreshToken(refreshToken);
    
    // Add user info to request
    req.user = payload;
    
    logAuth('Refresh token authenticated successfully', payload.userId, true, {
      email: payload.email,
      path: req.path
    });

    next();
  } catch (error) {
    logSecurity('Refresh token authentication failed - invalid token', 'high', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
};

/**
 * Middleware to require specific permissions
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logSecurity('Permission denied', 'medium', {
        userId: req.user.userId,
        email: req.user.email,
        requiredPermissions,
        userPermissions,
        path: req.path
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const userRole = req.user.role;
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole) {
      logSecurity('Role access denied', 'medium', {
        userId: req.user.userId,
        email: req.user.email,
        userRole,
        requiredRoles,
        path: req.path
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient role access',
        code: 'INSUFFICIENT_ROLE_ACCESS',
        requiredRoles
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require ownership of a resource
 */
export const requireOwnership = (resourceIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
    
    if (resourceId !== req.user.userId) {
      logSecurity('Ownership access denied', 'medium', {
        userId: req.user.userId,
        email: req.user.email,
        resourceId,
        path: req.path
      });

      res.status(403).json({
        success: false,
        message: 'Access denied - resource ownership required',
        code: 'OWNERSHIP_REQUIRED'
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = authService.verifyAccessToken(token);
      req.user = payload;
      
      logAuth('Optional authentication successful', payload.userId, true, {
        email: payload.email,
        path: req.path
      });
    } else {
      logAuth('Optional authentication failed - continuing without user', 'anonymous', false, {
        path: req.path
      });
    }
  } catch (error) {
    logAuth('Optional authentication failed - continuing without user', 'anonymous', false, {
      path: req.path,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  next();
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (req: Request, _res: Response, next: NextFunction): void => {
  // Simple rate limiting - in production, use a proper rate limiting library
  const clientIp = req.ip || req.connection.remoteAddress;
  
  logAuth('Authentication attempt', clientIp || 'unknown', true, {
    ip: clientIp,
    userAgent: req.get('User-Agent'),
    path: req.path
  });

  next();
}; 