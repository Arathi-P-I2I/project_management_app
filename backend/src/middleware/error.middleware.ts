import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logError } from '../config/logger';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: any[]) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
  public errors?: any[] | undefined;
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  // Log the error
  logError('Error occurred', error, {
    url: req.url,
    method: req.method,
    userId: (req as any).user?.userId || 'anonymous',
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    error = new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    error = new ValidationError('Invalid data provided');
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    error = new AppError('Database connection failed', 500, 'DATABASE_CONNECTION_ERROR');
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  } else if (error.name === 'NotBeforeError') {
    error = new AuthenticationError('Token not active');
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    error = new ValidationError('Validation failed');
  }

  // Handle cast errors (usually from MongoDB, but keeping for consistency)
  if (error.name === 'CastError') {
    error = new ValidationError('Invalid ID format');
  }

  // Handle duplicate key errors
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    error = new ConflictError('Duplicate entry');
  }

  // Default error
  if (!(error instanceof AppError)) {
    error = new AppError(
      error.message || 'Internal server error',
      500,
      'INTERNAL_SERVER_ERROR',
      false
    );
  }

  const appError = error as AppError;

  // Send error response
  const errorResponse: any = {
    success: false,
    message: appError.message,
    code: appError.code
  };

  // Add validation errors if available
  if (appError instanceof ValidationError && appError.errors) {
    errorResponse.errors = appError.errors;
  }

  // Add stack trace in development
  if (process.env['NODE_ENV'] === 'development') {
    errorResponse.stack = appError.stack;
  }

  // Add request ID if available
  if ((req as any).requestId) {
    errorResponse.requestId = (req as any).requestId;
  }

  res.status(appError.statusCode).json(errorResponse);
};

// Handle Prisma specific errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return new ConflictError('Unique constraint violation');
    case 'P2003':
      return new ValidationError('Foreign key constraint violation');
    case 'P2025':
      return new NotFoundError('Record not found');
    case 'P2021':
      return new AppError('Database table not found', 500, 'DATABASE_ERROR');
    case 'P2022':
      return new AppError('Database column not found', 500, 'DATABASE_ERROR');
    case 'P2014':
      return new ConflictError('The change you are trying to make would violate the required relation');
    case 'P2011':
      return new ValidationError('Null constraint violation');
    case 'P2012':
      return new ValidationError('Missing a required value');
    case 'P2013':
      return new ValidationError('Missing the required argument');
    case 'P2015':
      return new NotFoundError('Related record not found');
    case 'P2016':
      return new AppError('Query interpretation error', 500, 'DATABASE_ERROR');
    case 'P2017':
      return new AppError('Database connection error', 500, 'DATABASE_ERROR');
    case 'P2018':
      return new NotFoundError('Connected records not found');
    case 'P2019':
      return new ValidationError('Input error');
    case 'P2020':
      return new ValidationError('Value out of range');
    case 'P2023':
      return new ValidationError('Invalid column value');
    case 'P2024':
      return new AppError('Database connection pool timeout', 500, 'DATABASE_ERROR');
    case 'P2026':
      return new AppError('Database query timeout', 500, 'DATABASE_ERROR');
    case 'P2027':
      return new AppError('Multiple errors occurred', 500, 'DATABASE_ERROR');
    default:
      return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

// Rate limiting error handler
export const rateLimitHandler = (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: res.getHeader('Retry-After')
  });
};

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  rateLimitHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
}; 