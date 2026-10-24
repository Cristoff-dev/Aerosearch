export interface IProductDocument {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  isActive: boolean;
  createdAt: number;
  embedding?: number[];
}