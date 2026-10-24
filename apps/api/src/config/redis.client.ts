import { createClient, RedisClientType } from 'redis';

export class RedisConnection {
  private static instance: RedisClientType;

  private constructor() {}

  public static getInstance(): RedisClientType {
    if (!RedisConnection.instance) {
      RedisConnection.instance = createClient({
        url: process.env.REDIS_URL,
        socket: {
          keepAlive: true,
          reconnectStrategy: (retries: number) => Math.min(retries * 50, 2000),
        },
      });

      RedisConnection.instance.on('error', (err: Error) => {
        console.error('[Redis] Connection Error:', err.message);
      });

      RedisConnection.instance.on('connect', () => {
      });
    }

    return RedisConnection.instance;
  }

  public static async connect(): Promise<void> {
    const client = RedisConnection.getInstance();
    if (!client.isOpen) {
      await client.connect();
    }
  }

  public static async disconnect(): Promise<void> {
    if (RedisConnection.instance?.isOpen) {
      await RedisConnection.instance.quit();
    }
  }
}