import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { getLoggingConfig, isDevelopment, isProduction } from './utils';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// File transport configuration
const fileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info'
});

// Error file transport
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error'
});

// Create logger instance
const logger = winston.createLogger({
  level: getLoggingConfig().level,
  format: logFormat,
  defaultMeta: { service: 'project-management-api' },
  transports: [
    // File transports
    fileTransport,
    errorFileTransport
  ],
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Add console transport for development
if (isDevelopment()) {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Add console transport for production (errors only)
if (isProduction()) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: 'error'
  }));
}

// Custom logger methods
export const logInfo = (message: string, meta?: any): void => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: any): void => {
  if (error instanceof Error) {
    logger.error(message, { 
      error: error.message, 
      stack: error.stack,
      ...meta 
    });
  } else {
    logger.error(message, { error, ...meta });
  }
};

export const logWarn = (message: string, meta?: any): void => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any): void => {
  logger.debug(message, meta);
};

export const logHttp = (req: any, res: any, responseTime: number): void => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous'
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Database logging
export const logDatabase = (operation: string, table: string, duration: number, meta?: any): void => {
  logger.info('Database Operation', {
    operation,
    table,
    duration: `${duration}ms`,
    ...meta
  });
};

// Authentication logging
export const logAuth = (action: string, userId: string, success: boolean, meta?: any): void => {
  const level = success ? 'info' : 'warn';
  logger.log(level, 'Authentication', {
    action,
    userId,
    success,
    ...meta
  });
};

// File operation logging
export const logFileOperation = (operation: string, filename: string, size: number, meta?: any): void => {
  logger.info('File Operation', {
    operation,
    filename,
    size: `${size} bytes`,
    ...meta
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: any): void => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger.log(level, 'Performance', {
    operation,
    duration: `${duration}ms`,
    ...meta
  });
};

// Security logging
export const logSecurity = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any): void => {
  const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
  logger.log(level, 'Security Event', {
    event,
    severity,
    ...meta
  });
};

// API logging
export const logApi = (endpoint: string, method: string, statusCode: number, duration: number, meta?: any): void => {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, 'API Request', {
    endpoint,
    method,
    statusCode,
    duration: `${duration}ms`,
    ...meta
  });
};

// Export the main logger instance
export default logger;

// Export Winston for advanced usage
export { winston }; 