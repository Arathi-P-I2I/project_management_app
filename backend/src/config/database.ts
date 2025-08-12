import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from './logger';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || '',
    },
  },
  // Connection pooling configuration
  // Prisma automatically handles connection pooling, but we can configure it
  // through the DATABASE_URL with connection pool parameters
});

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;

// Database connection test
export const testConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    logInfo('Database connected successfully');
    return true;
  } catch (error) {
    logError('Database connection failed', error);
    return false;
  }
};

// Connection pool health check
export const checkConnectionPool = async (): Promise<{
  isHealthy: boolean;
  activeConnections?: number;
  idleConnections?: number;
  totalConnections?: number;
}> => {
  try {
    // Test a simple query to check connection health
    await prisma.$queryRaw`SELECT 1`;
    
    // In a real production environment, you might want to check actual pool metrics
    // For now, we'll return a basic health check
    return {
      isHealthy: true,
      activeConnections: 0, // Would be available in production monitoring
      idleConnections: 0,
      totalConnections: 0
    };
  } catch (error) {
    logError('Connection pool health check failed', error);
    return {
      isHealthy: false
    };
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logInfo('Database disconnected successfully');
  } catch (error) {
    logError('Database disconnection failed', error);
  }
};

// Database transaction wrapper
export const withTransaction = async <T>(
  fn: (tx: any) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(fn);
};

// Database connection monitoring
export const getConnectionInfo = () => {
  return {
    url: process.env['DATABASE_URL']?.split('?')[0] || 'unknown', // Hide connection params
    environment: process.env['NODE_ENV'] || 'unknown',
    timestamp: new Date().toISOString()
  };
}; 