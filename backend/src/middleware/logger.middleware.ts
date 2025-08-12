import { Request, Response, NextFunction } from 'express';
import { logHttp, logApi } from '../config/logger';

/**
 * HTTP request logging middleware
 * Logs all incoming requests with timing information
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    
    // Log HTTP request
    logHttp(req, res, responseTime);
    
    // Log API request for API endpoints
    if (req.path.startsWith('/api/')) {
      logApi(req.path, req.method, res.statusCode, responseTime, {
        query: req.query,
        params: req.params,
        body: req.method !== 'GET' ? req.body : undefined,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: (req as any).user?.id || 'anonymous'
      });
    }
    
    // Call original send method
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Error logging middleware
 * Logs all errors with detailed information
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const responseTime = Date.now() - (req as any).startTime || 0;
  
  // Log error details
  logApi(req.path, req.method, res.statusCode || 500, responseTime, {
    error: err.message,
    stack: err.stack,
    query: req.query,
    params: req.params,
    body: req.method !== 'GET' ? req.body : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.id || 'anonymous'
  });
  
  next(err);
};

/**
 * Performance monitoring middleware
 * Logs slow requests
 */
export const performanceLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    const originalSend = res.send;
    res.send = function(data: any) {
      const responseTime = Date.now() - startTime;
      
      if (responseTime > threshold) {
        logApi(req.path, req.method, res.statusCode, responseTime, {
          slowRequest: true,
          threshold: `${threshold}ms`,
          query: req.query,
          params: req.params,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress,
          userId: (req as any).user?.id || 'anonymous'
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Security logging middleware
 * Logs security-related events
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log failed authentication attempts
  if (res.statusCode === 401) {
    logApi(req.path, req.method, res.statusCode, 0, {
      securityEvent: 'authentication_failed',
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      query: req.query,
      params: req.params
    });
  }
  
  // Log forbidden access attempts
  if (res.statusCode === 403) {
    logApi(req.path, req.method, res.statusCode, 0, {
      securityEvent: 'access_forbidden',
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.id || 'anonymous',
      query: req.query,
      params: req.params
    });
  }
  
  // Log suspicious requests (multiple failed attempts)
  const failedAttempts = (req as any).failedAttempts || 0;
  if (failedAttempts > 5) {
    logApi(req.path, req.method, res.statusCode, 0, {
      securityEvent: 'suspicious_activity',
      failedAttempts,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      query: req.query,
      params: req.params
    });
  }
  
  next();
};

/**
 * Database query logging middleware
 * Logs database operations (if using Prisma)
 */
export const databaseLogger = (_req: Request, _res: Response, next: NextFunction): void => {
  // This middleware can be extended to log database queries
  // when using Prisma or other ORMs
  next();
};

export default {
  requestLogger,
  errorLogger,
  performanceLogger,
  securityLogger,
  databaseLogger
}; 