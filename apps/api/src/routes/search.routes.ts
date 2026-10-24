import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';
import { searchRateLimiter } from '../middlewares/rate-limiter.middleware.js';
import { validateRequest } from '../middlewares/request-validation.middleware.js';
import { searchSchema } from '../schemas/search.schema.js';

const router = Router();
const searchController = new SearchController();

router.get(
  '/search',
  searchRateLimiter,
  validateRequest(searchSchema),
  searchController.search
);

export default router;