import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { UserModel } from '@/lib/models/User';
import { verifyPassword, createAuthResponse } from '@/lib/auth';
import { authRateLimit } from '@/lib/rate-limit';
import { validateEmail, sanitizeString } from '@/lib/validation';
import { errorResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { HTTP_STATUS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await authRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    
    const body = await request.json();
    const email = sanitizeString(body.email || '').toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return errorResponse('Email and password are required', HTTP_STATUS.BAD_REQUEST);
    }

    if (!validateEmail(email)) {
      return errorResponse('Invalid email format', HTTP_STATUS.BAD_REQUEST);
    }

    const user = await UserModel.findOne({ email }).lean();
    
    if (!user || !(await verifyPassword(password, user.password))) {
      return errorResponse('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    logger.apiSuccess('Login successful', { userId: user.id });

    return createAuthResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isSetupComplete: user.isSetupComplete,
        businessDetails: user.businessDetails,
        createdAt: user.createdAt,
      },
    }, user.id, user.email);
  } catch (error) {
    logger.apiError('Login', error);
    return errorResponse('Login failed. Please try again.');
  }
}
