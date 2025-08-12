// Export main configuration
export { default as config } from './environment';
export { default as database } from './database';

// Export configuration utilities
export * from './utils';

// Export logging system
export { default as logger, logInfo, logError, logWarn, logDebug, logHttp, logApi, logDatabase, logAuth, logFileOperation, logPerformance, logSecurity } from './logger';

// Export individual config sections
export { 
  app, 
  database as dbConfig, 
  jwt, 
  cors, 
  fileUpload, 
  aws, 
  email, 
  redis, 
  logging, 
  security, 
  integrations, 
  monitoring 
} from './environment';

// Export seed function (if needed)
// export { seedDatabase } from './seed'; 