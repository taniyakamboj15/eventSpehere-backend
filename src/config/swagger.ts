import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventSphere API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for EventSphere - A modern event management platform',
      contact: {
        name: 'EventSphere Team',
        email: 'support@eventsphere.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: env.NODE_ENV === 'production' 
          ? 'https://api.eventsphere.com/api'
          : `http://localhost:${env.PORT}/api`,
        description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            meta: {
              type: 'object',
              properties: {
                errors: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['attendee', 'organizer', 'admin'],
              example: 'attendee',
            },
            isVerified: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Event: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              example: 'Tech Conference 2024',
            },
            description: {
              type: 'string',
              example: 'Annual technology conference featuring industry leaders',
            },
            category: {
              type: 'string',
              enum: ['conference', 'workshop', 'meetup', 'seminar', 'webinar', 'social', 'sports', 'other'],
              example: 'conference',
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private', 'community'],
              example: 'public',
            },
            organizer: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            community: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            startDateTime: {
              type: 'string',
              format: 'date-time',
            },
            endDateTime: {
              type: 'string',
              format: 'date-time',
            },
            location: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  example: '123 Main St, San Francisco, CA',
                },
                type: {
                  type: 'string',
                  example: 'Point',
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                  example: [-122.4194, 37.7749],
                },
              },
            },
            capacity: {
              type: 'number',
              example: 100,
            },
            attendeeCount: {
              type: 'number',
              example: 45,
            },
            recurringRule: {
              type: 'string',
              enum: ['none', 'daily', 'weekly', 'monthly'],
              example: 'none',
            },
            photos: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Community: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              example: 'Tech Enthusiasts',
            },
            type: {
              type: 'string',
              enum: ['public', 'private'],
              example: 'public',
            },
            description: {
              type: 'string',
              example: 'A community for technology enthusiasts',
            },
            location: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: 'Point',
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                  example: [-122.4194, 37.7749],
                },
              },
            },
            members: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            admins: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RSVP: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            user: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            event: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            status: {
              type: 'string',
              enum: ['going', 'maybe', 'not_going'],
              example: 'going',
            },
            ticketCode: {
              type: 'string',
              example: 'TKT-123456',
            },
            checkedIn: {
              type: 'boolean',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Events',
        description: 'Event management endpoints',
      },
      {
        name: 'Communities',
        description: 'Community management endpoints',
      },
      {
        name: 'RSVPs',
        description: 'Event RSVP management endpoints',
      },
      {
        name: 'Users',
        description: 'User profile and management endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
      {
        name: 'Health',
        description: 'Health check and monitoring endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/modules/*/routes/*.ts',
    './src/modules/*/*.routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
