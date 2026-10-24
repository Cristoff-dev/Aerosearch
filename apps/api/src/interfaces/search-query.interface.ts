export interface ISearchQuery {
  q: string;
  queryBy: string;
  page?: number;
  perPage?: number;
  filterBy?: string;
  sortBy?: string;
  useFuzzy?: boolean;
  useSemantic?: boolean;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number | string;
}

export interface ISearchResult<T> {
  hits: T[];
  found: number;
  page: number;
  searchTimeMs: number;
  source: 'cache' | 'engine' | 'database';
}