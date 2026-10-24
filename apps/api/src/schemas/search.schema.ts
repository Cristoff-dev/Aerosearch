import { z } from 'zod';

export const searchSchema = z.object({
  q: z.string({
    message: 'Query parameter "q" is required',
  }).min(1, 'Search query cannot be empty'),
  queryBy: z.string().optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
  perPage: z.string().regex(/^\d+$/, 'PerPage must be a positive integer').optional(),

  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional(), 

  filterBy: z.string().optional(),
  sortBy: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number').optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number').optional(),

  useFuzzy: z.enum(['true', 'false']).optional(),
  useSemantic: z.enum(['true', 'false']).optional(),
});