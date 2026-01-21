import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ProductModel } from '@/lib/models/Product';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { sanitize } from '@/lib/validation';

// GET single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return withAuth(async (req: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      const product = await ProductModel.findOne({ id, userId }).lean();
      
      if (!product) {
        return errorResponse('Product not found', 404);
      }

      return successResponse({ product });
    } catch (error) {
      console.error('Get product error:', error);
      return errorResponse('Failed to fetch product');
    }
  })(request as NextRequest);
}

// PUT update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return withAuth(async (req: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      const rawData = await req.json();
      const data = sanitize(rawData);
      
      const product = await ProductModel.findOneAndUpdate(
        { id, userId },
        data,
        { new: true }
      ).lean();

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      return successResponse({ product });
    } catch (error) {
      console.error('Update product error:', error);
      return errorResponse('Failed to update product');
    }
  })(request as NextRequest);
}

// DELETE product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return withAuth(async (req: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      const product = await ProductModel.findOneAndDelete({ id, userId });

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      return successResponse({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      return errorResponse('Failed to delete product');
    }
  })(request as NextRequest);
}
