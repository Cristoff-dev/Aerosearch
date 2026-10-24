import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';

const router = Router();
const productController = new ProductController();

router.post('/', productController.create);
router.patch('/:id', productController.update);
router.delete('/:id', productController.delete);

export default router;