import { Router, Request, Response } from 'express';
import { RedisConnection } from '../config/redis.client.js';
import { PrismaConnection } from '../config/prisma-client.config.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const redisClient = RedisConnection.getInstance();
    const redisPing = await redisClient.ping();

    const prisma = PrismaConnection.getInstance();
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        redis: redisPing === 'PONG' ? 'up' : 'down',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

export default router;