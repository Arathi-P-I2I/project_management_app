import config from './environment';

/**
 * Environment detection utilities
 */
export const isDevelopment = (): boolean => config.app.environment === 'development';
export const isProduction = (): boolean => config.app.environment === 'production';
export const isTest = (): boolean => config.app.environment === 'test';

/**
 * Configuration validation utilities
 */
export const validateRequiredConfig = (configSection: any, requiredKeys: string[]): void => {
  const missingKeys = requiredKeys.filter(key => !configSection[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(`Missing required configuration keys: ${missingKeys.join(', ')}`);
  }
};

/**
 * Database configuration helpers
 */
export const getDatabaseConfig = () => ({
  url: config.database.url,
  pool: config.database.pool,
  ssl: isProduction() ? { rejectUnauthorized: false } : false
});

/**
 * JWT configuration helpers
 */
export const getJwtConfig = () => ({
  secret: config.jwt.secret,
  expiresIn: config.jwt.expiresIn,
  refreshExpiresIn: config.jwt.refreshExpiresIn,
  algorithm: 'HS256' as const
});

/**
 * CORS configuration helpers
 */
export const getCorsConfig = () => ({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://project-management-app-ssgp.onrender.com' // Production frontend
  ],
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
});

/**
 * File upload configuration helpers
 */
export const getFileUploadConfig = () => ({
  maxSize: config.fileUpload.maxSize,
  allowedTypes: config.fileUpload.allowedTypes,
  uploadDir: 'uploads',
  tempDir: 'temp'
});

/**
 * Security configuration helpers
 */
export const getSecurityConfig = () => ({
  bcryptRounds: config.security.bcryptRounds,
  rateLimit: {
    windowMs: config.security.rateLimitWindowMs,
    maxRequests: config.security.rateLimitMaxRequests
  },
  session: {
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction(),
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }
});

/**
 * AWS configuration helpers
 */
export const getAwsConfig = () => ({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
  s3Bucket: config.aws.s3Bucket
});

/**
 * Email configuration helpers
 */
export const getEmailConfig = () => ({
  provider: config.email.provider,
  sendgridApiKey: config.email.sendgridApiKey,
  fromEmail: config.email.fromEmail,
  templates: {
    welcome: 'welcome-email',
    passwordReset: 'password-reset',
    projectInvite: 'project-invite',
    taskAssignment: 'task-assignment'
  }
});

/**
 * Redis configuration helpers
 */
export const getRedisConfig = () => ({
  url: config.redis.url,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

/**
 * Logging configuration helpers
 */
export const getLoggingConfig = () => ({
  level: config.logging.level,
  filePath: config.logging.filePath,
  format: isProduction() ? 'json' : 'simple',
  maxFiles: 5,
  maxSize: '10m'
});

/**
 * Integration configuration helpers
 */
export const getIntegrationConfig = () => ({
  google: {
    clientId: config.integrations.google.clientId,
    clientSecret: config.integrations.google.clientSecret,
    redirectUri: `${config.app.url}/api/v1/auth/google/callback`
  },
  github: {
    clientId: config.integrations.github.clientId,
    clientSecret: config.integrations.github.clientSecret,
    redirectUri: `${config.app.url}/api/v1/auth/github/callback`
  },
  slack: {
    botToken: config.integrations.slack.botToken,
    signingSecret: config.integrations.slack.signingSecret,
    webhookUrl: `${config.app.url}/api/v1/integrations/slack/webhook`
  }
});

/**
 * Monitoring configuration helpers
 */
export const getMonitoringConfig = () => ({
  sentry: {
    dsn: config.monitoring.sentryDsn,
    environment: config.app.environment,
    tracesSampleRate: isProduction() ? 0.1 : 1.0
  },
  analytics: {
    enabled: config.monitoring.analyticsEnabled,
    provider: 'google-analytics'
  }
});

/**
 * Environment-specific configuration helpers
 */
export const getEnvironmentConfig = () => {
  const baseConfig = {
    debug: isDevelopment(),
    verbose: isDevelopment(),
    cacheEnabled: !isDevelopment(),
    compressionEnabled: isProduction(),
    corsEnabled: true
  };

  if (isDevelopment()) {
    return {
      ...baseConfig,
      hotReload: true,
      detailedErrors: true,
      mockData: true
    };
  }

  if (isProduction()) {
    return {
      ...baseConfig,
      hotReload: false,
      detailedErrors: false,
      mockData: false,
      security: {
        helmet: true,
        rateLimit: true,
        cors: true
      }
    };
  }

  return baseConfig;
};

/**
 * Configuration validation for startup
 */
export const validateStartupConfig = (): void => {
  // Validate required configurations
  validateRequiredConfig(config.database, ['url']);
  validateRequiredConfig(config.jwt, ['secret']);
  
  // Validate environment-specific requirements
  if (isProduction()) {
    validateRequiredConfig(config.aws, ['accessKeyId', 'secretAccessKey', 's3Bucket']);
    validateRequiredConfig(config.email, ['sendgridApiKey']);
  }
  
  // Configuration validation passed - logged via logger
};

/**
 * Get configuration summary for logging
 */
export const getConfigSummary = () => ({
  app: {
    name: config.app.name,
    version: config.app.version,
    environment: config.app.environment,
    port: config.app.port
  },
  database: {
    url: config.database.url ? 'configured' : 'not configured',
    pool: config.database.pool
  },
  jwt: {
    secret: config.jwt.secret ? 'configured' : 'not configured',
    expiresIn: config.jwt.expiresIn
  },
  integrations: {
    google: config.integrations.google.clientId ? 'configured' : 'not configured',
    github: config.integrations.github.clientId ? 'configured' : 'not configured',
    slack: config.integrations.slack.botToken ? 'configured' : 'not configured'
  }
}); 