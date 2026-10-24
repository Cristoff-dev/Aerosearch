import request from 'supertest';
import app from '../../src/app'; 
import { PrismaConnection } from '../../src/config/prisma-client.config';
import { RedisConnection } from '../../src/config/redis.client';
import { randomUUID } from 'node:crypto';

describe('E2E: Enterprise Search Flow, Cache, AI & Resilience', () => {
  const activeProductIds = new Set<string>();

  beforeAll(async () => {
    await RedisConnection.connect();
    PrismaConnection.getInstance();
  });

  afterAll(async () => {
    try {
      if (activeProductIds.size > 0) {
        await Promise.allSettled(
          Array.from(activeProductIds).map(id => request(app).delete(`/api/v1/products/${id}`))
        );
      }
    } finally {
      await RedisConnection.disconnect();
      await PrismaConnection.disconnect();
    }
  });

  describe('Phase 1: Error Handling and Edge Cases', () => {
    it('Should reject product creation with invalid data (Zod 400 Bad Request)', async () => {
      const invalidProduct = {
        name: 'Incomplete Laptop',
        price: -150,
        category: 'Laptops'
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeDefined(); 
    });

    it('Should return 404 Not Found when attempting to delete a non-existent UUID', async () => {
      const fakeId = randomUUID();
      const response = await request(app)
        .delete(`/api/v1/products/${fakeId}`)
        .expect(404);

      expect(response.body.status).toBe('error');
    });
  });

  describe('Phase 2: Pagination and Strict Limits', () => {
    it('Should successfully bulk-inject multiple products', async () => {
      const products = [
        { name: 'Gamer Laptop Alpha', sku: `GL-A-${Date.now()}`, description: '16GB RAM', price: 1000, category: 'Laptops' },
        { name: 'Gamer Laptop Beta', sku: `GL-B-${Date.now()}`, description: '32GB RAM', price: 1500, category: 'Laptops' },
        { name: 'Gamer Laptop Gamma', sku: `GL-C-${Date.now()}`, description: '64GB RAM', price: 2000, category: 'Laptops' }
      ];

      for (const p of products) {
        const response = await request(app).post('/api/v1/products').send(p).expect(201);
        activeProductIds.add(response.body.data.id);
      }
    });

    it('Should respect the limit parameter and return exactly the requested amount', async () => {
      await new Promise((r) => setTimeout(r, 800));

      const response = await request(app)
        .get('/api/v1/search?q=Gamer Laptop&limit=2')
        .expect(200);
      
      expect(response.body.data.hits.length).toBe(2);
    });
  });

  describe('Phase 3: Semantic Vector Search (AI Embeddings)', () => {
    let semanticProductId: string;

    it('Should create a product with a complex semantic context', async () => {
      const semanticProduct = {
        name: 'AeroErgo Board',
        sku: `ERGO-${Date.now()}`,
        description: 'Split mechanical keyboard specifically designed to reduce wrist strain and prevent carpal tunnel during long coding sessions.',
        price: 150,
        category: 'Peripherals'
      };

      const response = await request(app).post('/api/v1/products').send(semanticProduct).expect(201);
      semanticProductId = response.body.data.id;
      activeProductIds.add(semanticProductId);
    });

    it('Should find the product using abstract concepts, not exact keywords', async () => {
      await new Promise((r) => setTimeout(r, 1000));

      const query = 'comfortable typing device for developers with arm pain';
      const response = await request(app)
        .get(`/api/v1/search?q=${encodeURIComponent(query)}&useSemantic=true`)
        .expect(200);

      expect(['engine', 'database']).toContain(response.body.data.source);
      
      const productWasFound = response.body.data.hits.some((p: any) => p.id === semanticProductId);
      expect(productWasFound).toBe(true);
    });
  });

  describe('Phase 4: Full Cache Lifecycle and Deletion', () => {
    let targetId: string;

    it('Should create a test product and hit the search engine (Cache Miss)', async () => {
      const p = { name: 'Cache Test Device', sku: `CACHE-${Date.now()}`, description: 'dummy', price: 99, category: 'Gadgets' };
      const resCreate = await request(app).post('/api/v1/products').send(p).expect(201);
      targetId = resCreate.body.data.id;
      activeProductIds.add(targetId);

      await new Promise((r) => setTimeout(r, 500));
      const resSearch = await request(app).get('/api/v1/search?q=Cache Test Device').expect(200);
      expect(resSearch.body.data.source).toBe('engine');
    });

    it('Should retrieve the result from Redis in under 25ms (Cache Hit)', async () => {
      const resSearch = await request(app).get('/api/v1/search?q=Cache Test Device').expect(200);
      
      expect(resSearch.body.data.source).toBe('cache');
      expect(resSearch.body.data.searchTimeMs).toBeLessThanOrEqual(25);
    });

    it('Should delete the product and trigger cache invalidation (204)', async () => {
      await request(app).delete(`/api/v1/products/${targetId}`).expect(204);
      activeProductIds.delete(targetId); 
    });

    it('Should register a Cache Miss after deletion and confirm it vanished', async () => {
      await new Promise((r) => setTimeout(r, 500));
      const resSearch = await request(app).get('/api/v1/search?q=Cache Test Device').expect(200);
      
      expect(resSearch.body.data.source).toBe('engine');
      const productExists = resSearch.body.data.hits.some((p: any) => p.id === targetId);
      expect(productExists).toBe(false);
    });
  });
});
