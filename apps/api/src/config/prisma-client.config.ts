import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export class PrismaConnection {
  private static instance: PrismaClient | null = null;
  private static pool: Pool | null = null;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaConnection.instance) {
      const connectionString = process.env.DATABASE_URL;
      PrismaConnection.pool = new Pool({ connectionString });
      const adapter = new PrismaPg(PrismaConnection.pool);

      PrismaConnection.instance = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }

    return PrismaConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaConnection.instance) {
      await PrismaConnection.instance.$disconnect();
      PrismaConnection.instance = null;
    }
    if (PrismaConnection.pool) {
      await PrismaConnection.pool.end();
      PrismaConnection.pool = null;
    }
  }
}

export const prisma = PrismaConnection.getInstance();
