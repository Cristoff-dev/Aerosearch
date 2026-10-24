import { CacheRepository } from '../repositories/cache.repository.js';
import { SearchEngineRepository } from '../repositories/search-engine.repository.js';
import { DatabaseRepository } from '../repositories/database.repository.js';
import { EmbeddingService } from './embedding.service.js';
import { ISearchQuery, ISearchResult } from '../interfaces/search-query.interface.js';
import { IProductDocument } from '../interfaces/product-document.interface.js';
import crypto from 'node:crypto';

export class SearchService {
  private readonly cacheRepository: CacheRepository;
  private readonly searchEngineRepository: SearchEngineRepository;
  private readonly databaseRepository: DatabaseRepository;
  private readonly embeddingService: EmbeddingService;

  constructor() {
    this.cacheRepository = new CacheRepository();
    this.searchEngineRepository = new SearchEngineRepository();
    this.databaseRepository = new DatabaseRepository();
    this.embeddingService = EmbeddingService.getInstance();
  }

  public async executeSearch(query: ISearchQuery): Promise<ISearchResult<IProductDocument>> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(query);

    const cachedResults = await this.cacheRepository.get(cacheKey);
    if (cachedResults) {
      return this.buildResponse(
        cachedResults as IProductDocument[], 
        cachedResults.length, 
        query.page || 1, 
        startTime, 
        'cache'
      );
    }

    try {

      if (query.useSemantic) {
        const semanticResults = await this.executeSemanticFallback(query, startTime);
        if (semanticResults.hits.length > 0) {
          await this.cacheRepository.set(cacheKey, semanticResults.hits);
        }
        return semanticResults;
      }

      const engineResponse = await this.searchEngineRepository.search(query);
      const hits = engineResponse.hits?.map((hit: { document: IProductDocument }) => hit.document) || [];
      const found = engineResponse.found || 0;

      if (hits.length > 0) {
        await this.cacheRepository.set(cacheKey, hits);
        return this.buildResponse(hits, found, query.page || 1, startTime, 'engine');
      }

      return this.buildResponse([], 0, query.page || 1, startTime, 'engine');

    } catch (error) {
      throw new Error(`Search execution failed: ${(error as Error).message}`);
    }
  }

  private async executeSemanticFallback(query: ISearchQuery, startTime: number): Promise<ISearchResult<IProductDocument>> {

    const queryVector = await this.embeddingService.generateVector(query.q);

    const dbResults = (await this.databaseRepository.findSimilarVector(
      queryVector,
      query.perPage || 10
    )) as IProductDocument[];

    return this.buildResponse(
      dbResults,
      dbResults.length,
      1,
      startTime,
      'database'
    );
  }

  private generateCacheKey(query: ISearchQuery): string {
    const serializedQuery = JSON.stringify({
      q: query.q?.trim().toLowerCase() || '',
      category: query.category,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sortBy: query.sortBy,
      page: query.page || 1,
      perPage: query.perPage || 20,
      useFuzzy: query.useFuzzy ?? true,
      useSemantic: query.useSemantic ?? false
    });

    const hash = crypto.createHash('sha256').update(serializedQuery).digest('hex');
    return `search:query:${hash}`;
  }

  private buildResponse(
    hits: IProductDocument[],
    found: number,
    page: number,
    startTime: number,
    source: 'cache' | 'engine' | 'database'
  ): ISearchResult<IProductDocument> {
    const endTime = performance.now();
    return {
      hits,
      found,
      page,
      searchTimeMs: Math.round(endTime - startTime),
      source
    };
  }
}