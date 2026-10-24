import { DatabaseRepository } from '../repositories/database.repository.js';
import { SearchEngineRepository } from '../repositories/search-engine.repository.js';
import { CacheRepository } from '../repositories/cache.repository.js';
import { EmbeddingService } from './embedding.service.js';
import { IProductDocument } from '../interfaces/product-document.interface.js';

export class ProductService {
  constructor(
    private readonly databaseRepository = new DatabaseRepository(),
    private readonly searchEngineRepository = new SearchEngineRepository(),
    private readonly cacheRepository = new CacheRepository(),
    private readonly embeddingService = EmbeddingService.getInstance()
  ) {}

  public async createProduct(data: Omit<IProductDocument, 'id'>): Promise<IProductDocument> {

    const semanticContext = this.buildSemanticContext(data);
    const embedding = await this.embeddingService.generateVector(semanticContext);

    const dbRecord = await this.databaseRepository.create(data, embedding);

    try {

      await this.searchEngineRepository.indexDocument({
        id: dbRecord.id.toString(),
        name: dbRecord.name,
        sku: dbRecord.sku,
        description: dbRecord.description,
        price: Number(dbRecord.price),
        category: dbRecord.category,
        tags: dbRecord.tags || [],
        isActive: dbRecord.isActive,
        createdAt: dbRecord.createdAt
      });
    } catch (indexingError) {
      console.error('[ProductService] Indexing failed. Possible data inconsistency:', indexingError);
      throw new Error(`Product saved to database but failed to index.`);
    }

    await this.invalidateSearchCaches();

    return dbRecord as IProductDocument;
  }

  public async updateProduct(id: string, data: Partial<IProductDocument>): Promise<IProductDocument> {

    const needsNewEmbedding = !!(data.name || data.description || data.category || data.tags);

    let updatedRecord = await this.databaseRepository.update(id, data);

    if (needsNewEmbedding) {
      const semanticContext = this.buildSemanticContext(updatedRecord);
      const newEmbedding = await this.embeddingService.generateVector(semanticContext);

      await this.databaseRepository.updateEmbedding(id, newEmbedding);
    }

    try {

      await this.searchEngineRepository.indexDocument({
        id: updatedRecord.id.toString(),
        name: updatedRecord.name,
        sku: updatedRecord.sku,
        description: updatedRecord.description,
        price: Number(updatedRecord.price),
        category: updatedRecord.category,
        tags: updatedRecord.tags || [],
        isActive: updatedRecord.isActive,
        createdAt: updatedRecord.createdAt
      });
    } catch (indexingError) {
      console.error(`[ProductService] Failed to update search index for ID ${id}:`, indexingError);
      throw new Error(`Product updated in database but failed to sync index.`);
    }

    await this.invalidateSearchCaches();

    return updatedRecord as IProductDocument;
  }

  public async deleteProduct(id: string): Promise<void> {
    await this.databaseRepository.delete(id);

    try {
      await this.searchEngineRepository.deleteDocument(id);
    } catch (deletionError) {
      console.error(`[ProductService] Failed to remove document ${id} from Typesense. Orphaned document possible.`);
    }

    await this.invalidateSearchCaches();
  }

  private async invalidateSearchCaches(): Promise<void> {
    try {
      await this.cacheRepository.deleteByPattern('search:*');
    } catch (error) {
      console.warn('[ProductService] Cache invalidation failed. Clients may see stale data.', error);
    }
  }

  /**
   * Centralizes the logic for how the AI model reads and interprets a product's context.
   */
  private buildSemanticContext(product: Partial<IProductDocument>): string {
    return `${product.name || ''}. ${product.description || ''}. Category: ${product.category || ''}. Tags: ${product.tags?.join(', ') || ''}`.trim();
  }
}