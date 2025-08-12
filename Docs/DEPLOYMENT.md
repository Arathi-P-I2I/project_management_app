# Project Management Dashboard - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Project Management Dashboard application in production environments.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Git
- At least 4GB RAM and 10GB disk space

## Quick Start (Docker Compose)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ProjectManagement
```

### 2. Configure Environment Variables

#### Backend Configuration

Copy the example environment file and update it with your production values:

```bash
cp backend/env.production.example backend/.env
```

Edit `backend/.env` with your production settings:

```env
NODE_ENV=production
APP_HOST=0.0.0.0
APP_PORT=3000
DATABASE_URL=postgresql://pm_user:pm_password@postgres:5432/project_management
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3001
```

#### Frontend Configuration

Copy the example environment file and update it:

```bash
cp frontend/env.production.example frontend/.env
```

Edit `frontend/.env` with your production settings:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Project Management Dashboard
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
```

### 3. Deploy the Application

Run the deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually deploy using Docker Compose:

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## Production Deployment

### Environment-Specific Configurations

#### Development
```bash
# Use development environment
NODE_ENV=development docker-compose up
```

#### Production
```bash
# Use production environment
NODE_ENV=production docker-compose up -d
```

### Database Setup

#### Initial Setup
```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database with sample data (optional)
docker-compose exec backend npm run db:seed
```

#### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U pm_user project_management > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U pm_user project_management < backup.sql
```

### SSL/HTTPS Setup

1. Obtain SSL certificates
2. Create `ssl/` directory in project root
3. Place certificates in `ssl/` directory
4. Update nginx configuration
5. Restart nginx service

### Monitoring and Logging

#### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

#### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:3001/health

# Database health
docker-compose exec postgres pg_isready -U pm_user -d project_management
```

## Scaling and Performance

### Horizontal Scaling

To scale the backend service:

```bash
docker-compose up --scale backend=3 -d
```

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Load Balancing

For production deployments, consider using a load balancer like Nginx or HAProxy.

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords for all services
- Rotate JWT secrets regularly
- Use environment-specific configurations

### Network Security
- Configure firewall rules
- Use VPN for database access
- Implement rate limiting
- Enable HTTPS in production

### Database Security
- Use strong database passwords
- Limit database access to application servers
- Enable SSL for database connections
- Regular security updates

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs <service-name>

# Check resource usage
docker stats

# Restart service
docker-compose restart <service-name>
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U pm_user -d project_management

# Check database logs
docker-compose logs postgres

# Reset database (WARNING: This will delete all data)
docker-compose down -v
docker-compose up -d
```

#### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Check nginx configuration
docker-compose exec nginx nginx -t

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Performance Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
# Add swap space if needed
```

#### Slow Response Times
```bash
# Check database performance
docker-compose exec postgres psql -U pm_user -d project_management -c "SELECT * FROM pg_stat_activity;"

# Check application logs for slow queries
docker-compose logs backend | grep "slow"
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor application logs
- Check service health
- Monitor resource usage

#### Weekly
- Review error logs
- Check database performance
- Update dependencies (if needed)

#### Monthly
- Security updates
- Database optimization
- Backup verification
- Performance review

### Backup Strategy

#### Automated Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U pm_user project_management > backup_$DATE.sql
```

#### Backup Retention
- Daily backups: Keep for 7 days
- Weekly backups: Keep for 4 weeks
- Monthly backups: Keep for 12 months

## Support

For deployment issues or questions:

1. Check the troubleshooting section above
2. Review application logs
3. Check the project documentation
4. Create an issue in the project repository

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
