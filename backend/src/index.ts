import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Import configuration
import config from './config/environment';
import { getCorsConfig, validateStartupConfig, getConfigSummary, isDevelopment } from './config/utils';

// Import logging
import { logInfo, logError } from './config/logger';
import { requestLogger, performanceLogger } from './middleware/logger.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';

// Import Swagger
import { specs, swaggerUi, swaggerUiOptions } from './config/swagger';

// Import error handling
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import database
import prisma from './config/database';

const app = express();

// Validate configuration on startup
validateStartupConfig();

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logError('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logError('Unhandled Rejection', reason, { promise: promise.toString() });
  process.exit(1);
});

// Initialize logging
logInfo('Application starting up', { 
  environment: config.app.environment,
  version: config.app.version,
  port: config.app.port 
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors(getCorsConfig()));
app.use(requestLogger); // Custom request logging
app.use(performanceLogger(1000)); // Log slow requests (>1s)
app.use(morgan(isDevelopment() ? 'dev' : 'combined')); // Additional logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Project Management API is running',
    timestamp: new Date().toISOString(),
    environment: config.app.environment,
    version: config.app.version,
    config: getConfigSummary()
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(config.app.port, () => {
  logInfo('Server started successfully', {
    url: `http://${config.app.host}:${config.app.port}`,
    healthCheck: `http://${config.app.host}:${config.app.port}/health`,
    environment: config.app.environment,
    config: getConfigSummary()
  });
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logError('Port already in use', error, { port: config.app.port });
    process.exit(1);
  } else {
    logError('Server error', error);
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logInfo(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    logInfo('Server closed');
    
    try {
      await prisma.$disconnect();
      logInfo('Database disconnected');
    } catch (error) {
      logError('Error disconnecting database', error);
    }
    
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app; 