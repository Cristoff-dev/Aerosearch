import { SwaggerUiOptions } from 'swagger-ui-express';
import process from 'node:process';

export const swaggerDocument = {
  openapi: '3.1.0',
  info: {
    title: 'AeroSearch API',
    version: '1.0.0',
    description: 'High-performance hybrid search microservice integrating fuzzy matching, vector embeddings (pgvector), and in-memory caching (Redis).',
    contact: {
      name: 'Cristofer Aranguren',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: 'Local environment',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          sku: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean' },
          createdAt: { type: 'number', description: 'Timestamp in milliseconds' },
        },
      },
      ProductInput: {
        type: 'object',
        required: ['sku', 'name', 'price', 'category'],
        properties: {
          sku: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean', default: true },
        },
      },
    },
  },
  tags: [
    { name: 'Search', description: 'Core search engine endpoints' },
    { name: 'Products', description: 'Product management & indexing (CQRS)' },
    { name: 'Health', description: 'Infrastructure status endpoints' },
  ],
  paths: {
    '/api/v1/search': {
      get: {
        tags: ['Search'],
        summary: 'Execute hybrid search query',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1 } },
          { name: 'category', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', required: false, schema: { type: 'number', minimum: 0 } },
          { name: 'maxPrice', in: 'query', required: false, schema: { type: 'number', minimum: 0 } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'perPage', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
          { name: 'useFuzzy', in: 'query', required: false, schema: { type: 'boolean', default: true } },
          { name: 'useSemantic', in: 'query', required: false, schema: { type: 'boolean', default: false }, description: 'Activates vector similarity search fallback' },
        ],
        responses: {
          '200': {
            description: 'Query executed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        hits: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                        found: { type: 'number' },
                        page: { type: 'number' },
                        searchTimeMs: { type: 'number' },
                        source: { type: 'string', enum: ['cache', 'engine', 'database'] },
                      }
                    }
                  },
                },
              },
            },
          },
          '400': { description: 'Bad Request - Invalid query parameters' },
        },
      },
    },
    '/api/v1/products': {
      post: {
        tags: ['Products'],
        summary: 'Create a new product and index it',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Product created and indexed' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/api/v1/products/{id}': {
      patch: {
        tags: ['Products'],
        summary: 'Update a product',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Product updated successfully' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product from DB and Search Engine',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'Product deleted' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API and infrastructure health',
        responses: {
          '200': { description: 'All systems operational' },
        },
      },
    },
  },
};

export const swaggerOptions: SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AeroSearch API Reference',
  swaggerOptions: {
    persistAuthorization: true,
  },
};