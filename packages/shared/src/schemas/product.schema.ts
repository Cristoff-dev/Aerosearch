import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  sku: z.string().min(3, 'SKU inválido').max(50),
  description: z.string().optional().default(''),
  price: z.number().positive('El precio debe ser un número positivo'),
  category: z.string().min(2, 'Selecciona una categoría válida'),
  tags: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const searchQueryParamsSchema = z.object({
  q: z.string().min(1, 'El término de búsqueda no puede estar vacío'),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  page: z.coerce.number().min(1).optional().default(1),
  useSemantic: z.coerce.boolean().optional().default(false),
});

export type ProductInput = z.infer<typeof productSchema>;
export type SearchQueryParams = z.infer<typeof searchQueryParamsSchema>;