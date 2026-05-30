import swaggerJsdoc from 'swagger-jsdoc';
import { getConfig } from './index';

export function createSwaggerSpec() {
  const config = getConfig();
  return swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'HIRING AI SUITE API',
        version: '1.0.0',
        description: 'B2B SaaS recruitment platform — backend API',
      },
      servers: [{ url: `http://localhost:${config.PORT}${config.API_PREFIX}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts', './docs/openapi.yaml'],
  });
}
