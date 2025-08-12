import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management API',
      version: '1.0.0',
      description: 'A comprehensive API for project management dashboard',
      contact: {
        name: 'API Support',
        email: 'support@projectmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.projectmanagement.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.jpg' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'USER'], example: 'USER' },
            isActive: { type: 'boolean', example: true },
            emailVerified: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            name: { type: 'string', example: 'E-commerce Platform' },
            description: { type: 'string', example: 'A modern e-commerce platform with advanced features' },
            status: { type: 'string', enum: ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], example: 'ACTIVE' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            budget: { type: 'number', example: 50000.00 },
            managerId: { type: 'string', example: 'clx1234567890abcdef' },
            teamMembers: { type: 'array', items: { type: 'string' }, example: ['user1', 'user2'] },
            tags: { type: 'array', items: { type: 'string' }, example: ['web', 'ecommerce'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            manager: { $ref: '#/components/schemas/User' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            title: { type: 'string', example: 'Implement user authentication' },
            description: { type: 'string', example: 'Create login and registration functionality' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'], example: 'IN_PROGRESS' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
            assigneeId: { type: 'string', nullable: true, example: 'clx1234567890abcdef' },
            projectId: { type: 'string', example: 'clx1234567890abcdef' },
            parentTaskId: { type: 'string', nullable: true },
            estimatedHours: { type: 'number', example: 8.0 },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            tags: { type: 'array', items: { type: 'string' }, example: ['auth', 'frontend'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            assignee: { $ref: '#/components/schemas/User' },
            project: { $ref: '#/components/schemas/Project' }
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expiresIn: { type: 'number', example: 86400 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email is required' },
                  type: { type: 'string', example: 'any.required' }
                }
              }
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Project' }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 25 },
                totalPages: { type: 'number', example: 3 }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const specs = swaggerJsdoc(options);

export const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Project Management API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true
  }
};

export { specs, swaggerUi }; 