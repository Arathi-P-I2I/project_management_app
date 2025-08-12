import dotenv from 'dotenv';
import path from 'path';

// Loads environment variables based on NODE_ENV (.env.production, .env.test, or .env)
const envFile = process.env['NODE_ENV'] === 'production' 
  ? '.env.production' 
  : process.env['NODE_ENV'] === 'test' 
    ? '.env.test' 
    : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Environment validation
const validateEnvironment = (): void => {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Configuration interface
interface Config {
  app: {
    name: string;
    version: string;
    environment: string;
    port: number;
    host: string;
    url: string;
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
  };
  email: {
    provider: string;
    sendgridApiKey: string;
    fromEmail: string;
  };
  redis: {
    url: string;
  };
  logging: {
    level: string;
    filePath: string;
  };
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  integrations: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    github: {
      clientId: string;
      clientSecret: string;
    };
    slack: {
      botToken: string;
      signingSecret: string;
    };
  };
  monitoring: {
    sentryDsn: string;
    analyticsEnabled: boolean;
  };
}

// Parse environment variables
const parseEnvVar = {
  string: (key: string, defaultValue?: string): string => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return value || defaultValue || '';
  },
  
  number: (key: string, defaultValue?: number): number => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required`);
    }
    const parsed = value ? parseInt(value, 10) : defaultValue;
    if (isNaN(parsed!)) {
      throw new Error(`Environment variable ${key} must be a valid number`);
    }
    return parsed!;
  },
  
  boolean: (key: string, defaultValue?: boolean): boolean => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      return false;
    }
    return value ? value.toLowerCase() === 'true' : defaultValue || false;
  },
  
  array: (key: string, defaultValue?: string[]): string[] => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      return [];
    }
    return value ? value.split(',').map(item => item.trim()) : defaultValue || [];
  }
};

// Configuration object
const config: Config = {
  app: {
    name: 'Project Management API',
    version: '1.0.0',
    environment: parseEnvVar.string('NODE_ENV', 'development'),
    port: parseEnvVar.number('PORT', 3000),
    host: parseEnvVar.string('HOST', 'localhost'),
    url: `${parseEnvVar.string('HOST', 'localhost')}:${parseEnvVar.number('PORT', 3000)}`
  },
  
  database: {
    url: parseEnvVar.string('DATABASE_URL'),
    pool: {
      min: parseEnvVar.number('DB_POOL_MIN', 2),
      max: parseEnvVar.number('DB_POOL_MAX', 10)
    }
  },
  
  jwt: {
    secret: parseEnvVar.string('JWT_SECRET'),
    expiresIn: parseEnvVar.string('JWT_EXPIRES_IN', '24h'),
    refreshExpiresIn: parseEnvVar.string('JWT_REFRESH_EXPIRES_IN', '7d')
  },
  
  cors: {
    origin: parseEnvVar.array('CORS_ORIGIN', ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3001']),
    credentials: parseEnvVar.boolean('CORS_CREDENTIALS', true)
  },
  
  fileUpload: {
    maxSize: parseEnvVar.number('MAX_FILE_SIZE', 10485760), // 10MB
    allowedTypes: parseEnvVar.array('ALLOWED_FILE_TYPES', [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ])
  },
  
  aws: {
    accessKeyId: parseEnvVar.string('AWS_ACCESS_KEY_ID', ''),
    secretAccessKey: parseEnvVar.string('AWS_SECRET_ACCESS_KEY', ''),
    region: parseEnvVar.string('AWS_REGION', 'us-east-1'),
    s3Bucket: parseEnvVar.string('AWS_S3_BUCKET', '')
  },
  
  email: {
    provider: parseEnvVar.string('EMAIL_PROVIDER', 'sendgrid'),
    sendgridApiKey: parseEnvVar.string('SENDGRID_API_KEY', ''),
    fromEmail: parseEnvVar.string('FROM_EMAIL', 'noreply@yourdomain.com')
  },
  
  redis: {
    url: parseEnvVar.string('REDIS_URL', 'redis://localhost:6379')
  },
  
  logging: {
    level: parseEnvVar.string('LOG_LEVEL', 'info'),
    filePath: parseEnvVar.string('LOG_FILE_PATH', 'logs/app.log')
  },
  
  security: {
    bcryptRounds: parseEnvVar.number('BCRYPT_ROUNDS', 12),
    rateLimitWindowMs: parseEnvVar.number('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    rateLimitMaxRequests: parseEnvVar.number('RATE_LIMIT_MAX_REQUESTS', 100)
  },
  
  integrations: {
    google: {
      clientId: parseEnvVar.string('GOOGLE_CLIENT_ID', ''),
      clientSecret: parseEnvVar.string('GOOGLE_CLIENT_SECRET', '')
    },
    github: {
      clientId: parseEnvVar.string('GITHUB_CLIENT_ID', ''),
      clientSecret: parseEnvVar.string('GITHUB_CLIENT_SECRET', '')
    },
    slack: {
      botToken: parseEnvVar.string('SLACK_BOT_TOKEN', ''),
      signingSecret: parseEnvVar.string('SLACK_SIGNING_SECRET', '')
    }
  },
  
  monitoring: {
    sentryDsn: parseEnvVar.string('SENTRY_DSN', ''),
    analyticsEnabled: parseEnvVar.boolean('ANALYTICS_ENABLED', true)
  }
};

// Validate environment on startup
validateEnvironment();

export default config;

// Export individual config sections for convenience
export const { app, database, jwt, cors, fileUpload, aws, email, redis, logging, security, integrations, monitoring } = config; 