import 'dotenv/config';
import { jest } from '@jest/globals';
import { RedisConnection } from '../src/config/redis.client.js';
import { PrismaConnection } from '../src/config/prisma-client.config.js';
import { seed } from '../prisma/seed.js';

jest.setTimeout(30000);

const typedArrays = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array,
];

for (const TypedArray of typedArrays) {
  try {
    Object.defineProperty(TypedArray, Symbol.hasInstance, {
      value: (inst: unknown) =>
        Boolean(
          inst &&
            ((inst as any).constructor?.name === TypedArray.name ||
              Object.prototype.toString.call(inst) === `[object ${TypedArray.name}]`)
        ),
      configurable: true,
    });
  } catch {
  }
}

beforeAll(async () => {
  const prisma = PrismaConnection.getInstance();
  const count = await prisma.product.count();
  if (count === 0) {
    await seed();
  }
});

afterAll(async () => {
  try {
    await RedisConnection.disconnect();
  } catch {}
  try {
    await PrismaConnection.disconnect();
  } catch {}
});
