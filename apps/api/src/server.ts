import 'dotenv/config';
import app from './app.js';
import { RedisConnection } from './config/redis.client.js';
import { PrismaConnection } from './config/prisma-client.config.js';
import { logger } from './utils/logger.util.js';
import process from 'node:process';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await RedisConnection.connect();
    logger.info('[Redis] Connection established successfully');

    PrismaConnection.getInstance();
    logger.info('[PostgreSQL] Connection initialized');

    const server = app.listen(PORT, () => {
      logger.info(`[Server] AeroSearch API running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await RedisConnection.disconnect();
          await PrismaConnection.getInstance().$disconnect();
          logger.info('[Server] Infrastructure connections closed. Exiting process.');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, '[Server] Error during graceful shutdown');
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    logger.fatal({ err: error }, '[Server] Bootstrap failed');
    process.exit(1);
  }
}

process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, '[Server] Uncaught Exception detected. Shutting down forcefully.');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ reason }, '[Server] Unhandled Rejection detected. Shutting down forcefully.');
  process.exit(1);
});

bootstrap();