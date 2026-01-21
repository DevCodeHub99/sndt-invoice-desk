import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { UserModel } from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { sanitize } from '@/lib/validation';

// GET user
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
      
      // Ensure user can only access their own data
      if (userId !== id) {
        return errorResponse('You can only access your own data', 403);
      }
      
      const user = await UserModel.findOne({ id }).lean();
      
      if (!user) {
        return errorResponse('User not found', 404);
      }

      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          isSetupComplete: user.isSetupComplete,
          businessDetails: user.businessDetails,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      return errorResponse('Failed to fetch user');
    }
  })(request as NextRequest);
}

// PUT update user/business details
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
      
      // Ensure user can only update their own data
      if (userId !== id) {
        return errorResponse('You can only update your own data', 403);
      }
      
      const rawData = await req.json();
      const data = sanitize(rawData);
      
      const user = await UserModel.findOneAndUpdate(
        { id },
        data,
        { new: true }
      ).lean();

      if (!user) {
        return errorResponse('User not found', 404);
      }

      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          isSetupComplete: user.isSetupComplete,
          businessDetails: user.businessDetails,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      return errorResponse('Failed to update user');
    }
  })(request as NextRequest);
}
