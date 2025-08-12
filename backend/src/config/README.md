# Configuration Management

This directory contains the configuration management system for the Project Management API.

## Overview

The configuration system provides:
- Environment-based configuration loading
- Type-safe configuration access
- Validation of required environment variables
- Utility functions for common configuration tasks
- Support for different environments (development, production, test)

## Files

### `environment.ts`
Main configuration file that:
- Loads environment variables based on NODE_ENV
- Validates required environment variables
- Provides type-safe configuration access
- Exports individual configuration sections

### `utils.ts`
Utility functions for:
- Environment detection (isDevelopment, isProduction, isTest)
- Configuration validation
- Helper functions for specific configuration sections
- Startup validation

### `database.ts`
Database configuration and connection management.

### `seed.ts`
Database seeding functionality.

### `index.ts`
Main export file for all configuration modules.

## Usage

### Basic Usage

```typescript
import config from './config/environment';

// Access configuration
const port = config.app.port;
const dbUrl = config.database.url;
const jwtSecret = config.jwt.secret;
```

### Using Utility Functions

```typescript
import { 
  isDevelopment, 
  getCorsConfig, 
  getJwtConfig,
  validateStartupConfig 
} from './config/utils';

// Environment detection
if (isDevelopment()) {
  console.log('Running in development mode');
}

// Get specific configurations
const corsConfig = getCorsConfig();
const jwtConfig = getJwtConfig();

// Validate configuration on startup
validateStartupConfig();
```

### Environment Variables

The system supports multiple environment files:
- `.env.local` - Local development (gitignored)
- `.env.production` - Production environment
- `.env.test` - Test environment

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment name

## Configuration Sections

### App Configuration
```typescript
config.app = {
  name: string;
  version: string;
  environment: string;
  port: number;
  host: string;
  url: string;
}
```

### Database Configuration
```typescript
config.database = {
  url: string;
  pool: {
    min: number;
    max: number;
  };
}
```

### JWT Configuration
```typescript
config.jwt = {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}
```

### CORS Configuration
```typescript
config.cors = {
  origin: string | string[];
  credentials: boolean;
}
```

### File Upload Configuration
```typescript
config.fileUpload = {
  maxSize: number;
  allowedTypes: string[];
}
```

### Security Configuration
```typescript
config.security = {
  bcryptRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}
```

## Environment Setup

1. Copy `env.example` to `.env.local`
2. Update the values in `.env.local` with your local configuration
3. For production, create `.env.production` with production values
4. For testing, create `.env.test` with test values

## Validation

The configuration system validates:
- Required environment variables are present
- Environment-specific requirements (e.g., AWS credentials in production)
- Data types and formats

## Best Practices

1. **Never commit sensitive data**: Use `.env.local` for local development and keep it in `.gitignore`
2. **Use environment-specific files**: Different configurations for different environments
3. **Validate on startup**: Always call `validateStartupConfig()` on application startup
4. **Use utility functions**: Use the provided utility functions instead of accessing config directly
5. **Type safety**: Always use the typed configuration interface

## Troubleshooting

### Common Issues

1. **Missing environment variables**: Check that all required variables are set
2. **Invalid data types**: Ensure numeric values are actually numbers
3. **File not found**: Make sure the environment file exists and is in the correct location

### Debug Configuration

```typescript
import { getConfigSummary } from './config/utils';

console.log('Configuration summary:', getConfigSummary());
```

This will log a summary of the current configuration without exposing sensitive data. 