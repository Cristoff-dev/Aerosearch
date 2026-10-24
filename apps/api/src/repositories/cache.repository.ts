import { RedisConnection } from '../config/redis.client.js';
import { IProductDocument } from '../interfaces/product-document.interface.js';

export class CacheRepository {
  private readonly client = RedisConnection.getInstance();
  private readonly DEFAULT_TTL = 300;

  public async get(key: string): Promise<IProductDocument[] | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`[CacheRepository] Corrupted JSON data at key ${key}`, error);
      return null;
    }
  }

  public async set(key: string, value: IProductDocument[], ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }

  /**
   * Purges multiple keys based on a pattern using non-blocking SCAN.
   * Required by the ProductService for cache invalidation.
   */
  /**
   * Purges multiple keys based on a pattern using non-blocking SCAN.
   * Required by the ProductService for cache invalidation.
   */
  public async deleteByPattern(pattern: string): Promise<void> {
    let cursor = '0'; 

    do {
      const result = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100 
      });

      cursor = result.cursor; 
      const keys = result.keys;

      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } while (cursor !== '0'); 
  }
}