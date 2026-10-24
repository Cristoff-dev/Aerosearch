export interface IProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  isActive: boolean;
  createdAt: number;
}

export interface ISearchHit extends IProduct {
  _highlight?: {
    name?: string;
    description?: string;
  };
}

export interface ISearchResponse {
  status: 'success' | 'error';
  data: {
    hits: ISearchHit[];
    found: number;
    page: number;
    searchTimeMs: number;
    source: 'cache' | 'engine' | 'database';
  };
}