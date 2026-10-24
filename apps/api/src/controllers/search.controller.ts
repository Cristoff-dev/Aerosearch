import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SearchService } from '../services/search.service.js';
import { ISearchQuery } from '../interfaces/search-query.interface.js';

const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  queryBy: z.string().optional().default('name,description,category'),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),

  limit: z.coerce.number().int().positive().max(100).optional(),

  useFuzzy: z.string().optional().default('true').transform(val => val !== 'false'),
  useSemantic: z.string().optional().default('false').transform(val => val === 'true'),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export class SearchController {
  private readonly searchService: SearchService;

  constructor(searchService?: SearchService) {
    this.searchService = searchService || new SearchService();
  }

  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      const validatedQuery: ISearchQuery = searchQuerySchema.parse(req.query);

      const result = await this.searchService.executeSearch(validatedQuery);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid search parameters',
          errors: error.format()
        });
        return;
      }
      next(error);
    }
  };
}