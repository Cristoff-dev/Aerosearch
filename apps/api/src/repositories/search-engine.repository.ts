import { TypesenseConnection } from '../config/typesense.client.js';
import { IProductDocument } from '../interfaces/product-document.interface.js';
import { ISearchQuery } from '../interfaces/search-query.interface.js';

export class SearchEngineRepository {
  private readonly client = TypesenseConnection.getInstance();

  private readonly COLLECTION_NAME = 'products_v6'; 
  private isCollectionInitialized = false;

  private async ensureCollectionExists(): Promise<void> {
    if (this.isCollectionInitialized) return;

    try {
      await this.client.collections(this.COLLECTION_NAME).retrieve();
      this.isCollectionInitialized = true;
    } catch (error: any) {
      if (error?.httpStatus === 404 || error?.message?.includes('Not Found')) {
        try {
          await this.client.collections().create({
            name: this.COLLECTION_NAME,
            fields: [
              { name: 'id', type: 'string' },
              { name: 'sku', type: 'string' },
              { name: 'name', type: 'string' },
              { name: 'description', type: 'string', optional: true },
              { name: 'category', type: 'string', facet: true },
              { name: 'price', type: 'float' },
              { name: 'tags', type: 'string[]', optional: true, facet: true },
              { name: 'isActive', type: 'bool', optional: true },
              { name: 'createdAt', type: 'int64', optional: true },
              { name: 'embedding', type: 'float[]', num_dims: 768, optional: true }
            ],

            symbols_to_index: ['-'], 
            default_sorting_field: 'price',
          });
          this.isCollectionInitialized = true;
        } catch (createError) {
          console.error('[Typesense] Failed to auto-create collection:', createError);
          throw createError;
        }
      } else {
        throw error;
      }
    }
  }

  public async search(query: ISearchQuery) {
    await this.ensureCollectionExists();

    const rawLimit = (query as any).limit ?? (query as any).perPage ?? (query as any).per_page ?? (query as any).size;
    const limitValue = Number(rawLimit);
    const perPage = !isNaN(limitValue) && limitValue > 0 ? limitValue : 20;

    const rawPage = (query as any).page;
    const pageValue = Number(rawPage);
    const page = !isNaN(pageValue) && pageValue > 0 ? pageValue : 1;

    const searchParameters: any = {
      q: query.q || '*',

      query_by: 'sku,name,category,description',

      num_typos: '0,2,2,2',

      page,
      per_page: perPage,
      split_join_tokens: 'fallback',
    };

    const filterClauses: string[] = [];

    if (query.category) {
      filterClauses.push(`category:=${query.category}`);
    }
    if (query.minPrice !== undefined && query.minPrice !== null && String(query.minPrice) !== '') {
      filterClauses.push(`price:>=${query.minPrice}`);
    }
    if (query.maxPrice !== undefined && query.maxPrice !== null && String(query.maxPrice) !== '') {
      filterClauses.push(`price:<=${query.maxPrice}`);
    }

    if (filterClauses.length > 0) {
      searchParameters.filter_by = filterClauses.join(' && ');
    }

    if (query.sortBy) {
      searchParameters.sort_by = query.sortBy;
    }

    if (query.useFuzzy === false || String(query.useFuzzy) === 'false') {
      searchParameters.num_typos = 0;
    }

    try {
      const response: any = await this.client.multiSearch.perform(
        { searches: [{ collection: this.COLLECTION_NAME, ...searchParameters }] },
        {}
      );

      const finalResult = response.results[0] as any;

      if (finalResult && finalResult.hits && finalResult.hits.length > perPage) {
        finalResult.hits = finalResult.hits.slice(0, perPage);
      }

      return finalResult;
    } catch (error) {
      throw new Error(`Typesense search failed: ${(error as Error).message}`);
    }
  }

  public async indexDocument(document: IProductDocument): Promise<void> {
    await this.ensureCollectionExists();

    await this.client
      .collections(this.COLLECTION_NAME)
      .documents()
      .upsert(document);
  }

  public async deleteDocument(id: string): Promise<void> {
    await this.ensureCollectionExists();

    try {
      await this.client
        .collections(this.COLLECTION_NAME)
        .documents(id)
        .delete();
    } catch (error: any) {
      if (error?.httpStatus !== 404) {
        throw error;
      }
    }
  }
}