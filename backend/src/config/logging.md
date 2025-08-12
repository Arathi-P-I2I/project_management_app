# Logging System Documentation

This document describes the logging system implemented using Winston for the Project Management API.

## Overview

The logging system provides:
- Structured JSON logging for production
- Colored console output for development
- Daily rotating log files
- Separate error log files
- Performance monitoring
- Security event logging
- HTTP request logging
- Database operation logging

## Configuration

### Log Levels
- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages (development only)

### Log Files
- `logs/application-YYYY-MM-DD.log` - General application logs
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `logs/rejections-YYYY-MM-DD.log` - Unhandled promise rejections

### Environment-Specific Behavior
- **Development**: Console output with colors + file logging
- **Production**: File logging only (errors to console)
- **Test**: File logging only

## Usage

### Basic Logging

```typescript
import { logInfo, logError, logWarn, logDebug } from '../config/logger';

// Info logging
logInfo('User logged in successfully', { userId: '123', email: 'user@example.com' });

// Error logging
try {
  // Some operation
} catch (error) {
  logError('Failed to process user data', error, { userId: '123' });
}

// Warning logging
logWarn('Database connection slow', { responseTime: '2.5s' });

// Debug logging (development only)
logDebug('Processing request', { query: req.query });
```

### HTTP Request Logging

The system automatically logs all HTTP requests with:
- Request method and URL
- Response status code
- Response time
- User agent
- IP address
- User ID (if authenticated)

### Performance Logging

```typescript
import { logPerformance } from '../config/logger';

const startTime = Date.now();
// ... perform operation
const duration = Date.now() - startTime;

logPerformance('Database query', duration, { 
  table: 'users', 
  operation: 'SELECT' 
});
```

### Security Logging

```typescript
import { logSecurity } from '../config/logger';

// Log security events
logSecurity('Failed login attempt', 'medium', {
  email: 'user@example.com',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

logSecurity('Suspicious activity detected', 'high', {
  userId: '123',
  action: 'multiple_failed_logins',
  count: 10
});
```

### Database Logging

```typescript
import { logDatabase } from '../config/logger';

const startTime = Date.now();
const result = await prisma.user.findMany();
const duration = Date.now() - startTime;

logDatabase('SELECT', 'users', duration, {
  count: result.length,
  filters: { active: true }
});
```

### Authentication Logging

```typescript
import { logAuth } from '../config/logger';

// Successful login
logAuth('login', userId, true, {
  method: 'password',
  ip: req.ip
});

// Failed login
logAuth('login', email, false, {
  method: 'password',
  ip: req.ip,
  reason: 'invalid_password'
});
```

## Middleware

### Request Logger
Automatically logs all HTTP requests with timing information.

```typescript
import { requestLogger } from '../middleware/logger.middleware';

app.use(requestLogger);
```

### Performance Logger
Logs requests that take longer than a specified threshold.

```typescript
import { performanceLogger } from '../middleware/logger.middleware';

app.use(performanceLogger(1000)); // Log requests > 1 second
```

### Error Logger
Logs all errors with detailed information.

```typescript
import { errorLogger } from '../middleware/logger.middleware';

app.use(errorLogger);
```

## Log Format

### JSON Format (Production)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User logged in successfully",
  "service": "project-management-api",
  "userId": "123",
  "email": "user@example.com"
}
```

### Console Format (Development)
```
10:30:00 [info]: User logged in successfully {"userId":"123","email":"user@example.com"}
```

## Best Practices

1. **Use appropriate log levels**:
   - `error` - For errors that need immediate attention
   - `warn` - For issues that should be investigated
   - `info` - For general application flow
   - `debug` - For detailed debugging information

2. **Include relevant context**:
   - User ID for user-related operations
   - Request ID for request tracking
   - Performance metrics for slow operations
   - Error details with stack traces

3. **Avoid logging sensitive data**:
   - Never log passwords, tokens, or personal information
   - Use placeholders for sensitive fields
   - Consider data masking for PII

4. **Use structured logging**:
   - Always include relevant metadata
   - Use consistent field names
   - Include timestamps and correlation IDs

5. **Monitor log levels**:
   - Set appropriate log levels for different environments
   - Monitor error rates and patterns
   - Set up alerts for critical errors

## Monitoring and Alerting

### Log Analysis
- Monitor error rates and patterns
- Track performance metrics
- Identify security threats
- Analyze user behavior

### Alerting
- Set up alerts for high error rates
- Monitor for security events
- Track slow response times
- Alert on system failures

## Troubleshooting

### Common Issues

1. **Log files not created**: Check directory permissions
2. **High disk usage**: Adjust log rotation settings
3. **Missing logs**: Verify log level configuration
4. **Performance impact**: Use async logging for high-volume operations

### Debug Configuration

```typescript
import { getConfigSummary } from '../config/utils';

console.log('Logging configuration:', getConfigSummary());
```

## Integration with Monitoring Tools

The logging system can be integrated with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- New Relic
- AWS CloudWatch

Configure the appropriate transport in the logger configuration for your monitoring platform. 