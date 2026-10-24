import 'dotenv/config';
import { PrismaConnection } from '../src/config/prisma-client.config.js';
import { SearchEngineRepository } from '../src/repositories/search-engine.repository.js';
import { EmbeddingService } from '../src/services/embedding.service.js'; 

const prisma = PrismaConnection.getInstance();
const searchEngine = new SearchEngineRepository();
const embeddingService = EmbeddingService.getInstance();

export async function main() {
  const dummyProducts = [
    {
      sku: 'LAP-LEN-X1-12',
      name: 'Lenovo ThinkPad X1 Carbon Gen 12',
      description: 'Ultralight enterprise laptop featuring a carbon fiber chassis. Equipped with Intel Core i7 processor, 32GB RAM, and 1TB SSD.',
      price: 1699.50,
      category: 'Laptops'
    },
    {
      sku: 'LAP-APP-MBP-16',
      name: 'Apple MacBook Pro 16" M3 Max',
      description: 'High-performance laptop for creative professionals. 16-core M3 Max chip, 64GB unified memory, Liquid Retina XDR display.',
      price: 3499.00,
      category: 'Laptops'
    },
    {
      sku: 'ACC-LOG-MX3S',
      name: 'Logitech MX Master 3S',
      description: 'Performance wireless mouse featuring quiet clicks, 8000 DPI sensor, and MagSpeed electromagnetic scroll wheel.',
      price: 99.99,
      category: 'Accessories'
    },
    {
      sku: 'MON-DEL-U2723QE',
      name: 'Dell UltraSharp 27 4K USB-C Hub Monitor',
      description: '4K UHD monitor with IPS Black technology for high contrast ratio. Includes integrated USB-C hub with 90W power delivery.',
      price: 649.00,
      category: 'Monitors'
    },
    {
      sku: 'SRV-DEL-R750',
      name: 'Dell PowerEdge R750 Rack Server',
      description: '2U enterprise server with 3rd Gen Intel Xeon Scalable processors, optimized for high-performance databases and virtualization.',
      price: 4850.00,
      category: 'Servers'
    },
    {
      sku: 'NET-UBI-UDM-PRO',
      name: 'Ubiquiti UniFi Dream Machine Pro',
      description: 'Enterprise-grade security gateway and network console with 8-port Gigabit switch and 3.5" HDD bay support.',
      price: 379.00,
      category: 'Networking'
    }
  ];

  let successCount = 0;

  for (const item of dummyProducts) {
    try {
      const textToEmbed = `${item.name} ${item.description} Category: ${item.category}`;
      const embedding = await embeddingService.generateVector(textToEmbed);

      const dbRecord = await prisma.product.upsert({
        where: { sku: item.sku },
        update: item,
        create: item,
      });

      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE "products" 
        SET "embedding" = ${vectorString}::vector 
        WHERE "id" = ${dbRecord.id}
      `;

      await searchEngine.indexDocument({
        id: dbRecord.id.toString(),
        name: dbRecord.name,
        sku: dbRecord.sku,
        description: dbRecord.description,
        price: dbRecord.price.toNumber(),
        category: dbRecord.category
      } as any);

      successCount++;
    } catch (error) {
      console.error(`❌ Error synchronizing ${item.sku}:`, error);
    }
  }

}

export const seed = main;

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  main()
    .catch((error) => {
      console.error('Critical error during seeding execution:', error);
      process.exit(1);
    })
    .finally(async () => {
      await PrismaConnection.disconnect();
    });
}
