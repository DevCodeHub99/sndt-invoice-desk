import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LaborModel } from '@/lib/models/Labor';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { sanitize } from '@/lib/validation';

// GET single labor charge
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
      const labor = await LaborModel.findOne({ id, userId }).lean();
      
      if (!labor) {
        return errorResponse('Labor charge not found', 404);
      }

      return successResponse({ labor });
    } catch (error) {
      console.error('Get labor error:', error);
      return errorResponse('Failed to fetch labor charge');
    }
  })(request as NextRequest);
}

// PUT update labor charge
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
      
      const labor = await LaborModel.findOneAndUpdate(
        { id, userId },
        data,
        { new: true }
      ).lean();

      if (!labor) {
        return errorResponse('Labor charge not found', 404);
      }

      return successResponse({ labor });
    } catch (error) {
      console.error('Update labor error:', error);
      return errorResponse('Failed to update labor charge');
    }
  })(request as NextRequest);
}

// DELETE labor charge
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
      const labor = await LaborModel.findOneAndDelete({ id, userId });

      if (!labor) {
        return errorResponse('Labor charge not found', 404);
      }

      return successResponse({ message: 'Labor charge deleted successfully' });
    } catch (error) {
      console.error('Delete labor error:', error);
      return errorResponse('Failed to delete labor charge');
    }
  })(request as NextRequest);
}

