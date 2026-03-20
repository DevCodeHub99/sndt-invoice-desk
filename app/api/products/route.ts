import { ProductModel } from '@/lib/models/Product';
import { createCrudHandlers, errorResponse, successResponse } from '@/lib/api-helpers';
import { sanitize, validateRequired } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { connectDB } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Use generic CRUD handlers
const handlers = createCrudHandlers(ProductModel, 'products', {
  requiredFields: ['name', 'price'],
  userIdField: 'userId',
});

// GET all products with pagination
export const GET = handlers.getAll;

// POST create product
export const POST = withAuth(async (request: NextRequest, userId: string) => {
  const rateLimitResponse = await apiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const rawData = await request.json();
    const data = sanitize(rawData);

    // Validate required fields
    const validation = validateRequired(data, ['name', 'price']);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Validate price is a positive number
    if (typeof data.price !== 'number' || data.price < 0) {
      return errorResponse('Price must be a positive number', 400);
    }

    const product = await ProductModel.create({
      ...data,
      description: data.description || '',
      id: uuidv4(),
      userId,
      createdAt: new Date(),
    });

    return NextResponse.json(
      successResponse({ product }),
      { status: 201 }
    );
  } catch (error) {
    logger.apiError('Create product', error, { userId });
    return errorResponse('Failed to create product');
  }
});
