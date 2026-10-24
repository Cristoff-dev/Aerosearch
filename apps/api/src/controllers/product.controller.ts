import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ProductService } from '../services/product.service.js';
import { IProductDocument } from '../interfaces/product-document.interface.js';

const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  sku: z.string().min(3).max(50),
  description: z.string().optional(), 
  price: z.number().positive(),
  category: z.string().min(2),
  tags: z.array(z.string()).optional(), 
  isActive: z.boolean().optional()      
});

const updateProductSchema = createProductSchema.partial();

type CreateProductDto = z.infer<typeof createProductSchema>;
type UpdateProductDto = z.infer<typeof updateProductSchema>;

export class ProductController {
  private readonly productService: ProductService;

  constructor(productService?: ProductService) {
    this.productService = productService || new ProductService();
  }

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      const validatedData: CreateProductDto = createProductSchema.parse(req.body);

      const productPayload: Omit<IProductDocument, 'id'> = {
        ...validatedData,
        description: validatedData.description || '',
        tags: validatedData.tags || [],
        isActive: validatedData.isActive ?? true,
        createdAt: Date.now(),
      };

      const newProduct = await this.productService.createProduct(productPayload);

      res.status(201).json({
        status: 'success',
        data: newProduct,
      });
    } catch (error) {
      this.handleControllerError(error, res, next);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      const productId = req.params.id as string; 

      const validatedData: UpdateProductDto = updateProductSchema.parse(req.body);

      const updatedProduct = await this.productService.updateProduct(productId, validatedData);

      res.status(200).json({
        status: 'success',
        data: updatedProduct,
      });
    } catch (error) {
      this.handleControllerError(error, res, next);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      const productId = req.params.id as string;

      await this.productService.deleteProduct(productId);

      res.status(204).send();
    } catch (error) {

      this.handleControllerError(error, res, next);
    }
  };

  /**
   * Manejador centralizado de errores del controlador.
   * Intercepta errores de Zod (400) y de Prisma (404/409).
   */
  private handleControllerError(error: unknown, res: Response, next: NextFunction): void {

    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid request payload',
        errors: error.format()
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(404).json({
          status: 'error',
          message: 'Product not found or already deleted'
        });
        return;
      }

      if (error.code === 'P2002') {
        res.status(409).json({
          status: 'error',
          message: 'A product with this unique field (e.g. SKU) already exists'
        });
        return;
      }
    }

    next(error);
  }
}