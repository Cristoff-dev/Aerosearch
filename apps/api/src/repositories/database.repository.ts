import { PrismaClient, Product } from '@prisma/client';
import { PrismaConnection } from '../config/prisma-client.config.js';
import { IProductDocument } from '../interfaces/product-document.interface.js';

export class DatabaseRepository {
  private readonly prisma: PrismaClient = PrismaConnection.getInstance();

  public async create(data: Omit<IProductDocument, 'id'>, embedding?: number[]): Promise<IProductDocument> {
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        category: data.category,
        tags: data.tags || [],
        isActive: data.isActive ?? true,
      },
    });

    if (embedding && embedding.length === 768) {
      const formattedVector = `[${embedding.join(',')}]`;
      await this.prisma.$executeRaw`
        UPDATE products 
        SET embedding = ${formattedVector}::vector 
        WHERE id = ${product.id}::uuid
      `;
    }

    const mappedProduct = this.mapToDocument(product);
    if (embedding) {
      mappedProduct.embedding = embedding;
    }

    return mappedProduct;
  }

  public async update(id: string, data: Partial<IProductDocument>): Promise<IProductDocument> {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        category: data.category,
        tags: data.tags,
        isActive: data.isActive,
      },
    });

    return this.mapToDocument(product);
  }

  /**
   * Actualiza EXCLUSIVAMENTE el vector de un producto.
   * Altamente optimizado para no tocar el resto de los campos de la tabla.
   */
  public async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    if (!embedding || embedding.length !== 768) {
      throw new Error('[DatabaseRepository] Invalid embedding vector length. Expected exactly 768 dimensions.');
    }

    const formattedVector = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      UPDATE products 
      SET embedding = ${formattedVector}::vector 
      WHERE id = ${id}::uuid
    `;
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  public async findById(id: string): Promise<IProductDocument | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) return null;

    return this.mapToDocument(product);
  }

  public async findSimilarVector(embedding: number[], limit: number = 10): Promise<IProductDocument[]> {
    const formattedVector = `[${embedding.join(',')}]`;

    const products = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        sku, 
        name, 
        description, 
        price, 
        category, 
        tags, 
        "isActive", 
        created_at AS "createdAt"
      FROM products
      WHERE "isActive" = true AND embedding IS NOT NULL
      ORDER BY embedding <=> ${formattedVector}::vector
      LIMIT ${limit};
    `;

    return products.map(product => this.mapToDocument(product));
  }

  /**
   * Centralized data mapper to convert database models into infrastructure-agnostic documents.
   */
  private mapToDocument(product: any): IProductDocument {
    return {
      id: product.id.toString(),
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: Number(product.price), 
      category: product.category,
      tags: product.tags || [],
      isActive: product.isActive ?? true,

      createdAt: product.createdAt ? new Date(product.createdAt).getTime() : Date.now(),
    };
  }
}