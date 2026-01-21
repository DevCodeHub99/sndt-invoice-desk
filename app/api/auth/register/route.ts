import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { UserModel } from '@/lib/models/User';
import { hashPassword, createAuthResponse } from '@/lib/auth';
import { authRateLimit } from '@/lib/rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { validateEmail, validatePassword, sanitizeString } from '@/lib/validation';
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

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(
        passwordValidation.errors?.join(', ') || 'Invalid password',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      return errorResponse('Email already registered', HTTP_STATUS.CONFLICT);
    }

    const newUser = await UserModel.create({
      id: uuidv4(),
      email,
      password: await hashPassword(password),
      isSetupComplete: false,
      createdAt: new Date(),
    });

    return createAuthResponse({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        isSetupComplete: newUser.isSetupComplete,
        businessDetails: newUser.businessDetails,
        createdAt: newUser.createdAt,
      },
    }, newUser.id, newUser.email, HTTP_STATUS.CREATED);
  } catch (error) {
    logger.apiError('Register', error);
    return errorResponse('Registration failed. Please try again.');
  }
}
