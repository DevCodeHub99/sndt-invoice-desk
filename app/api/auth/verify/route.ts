import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthRequest, setAuthCookies, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { HTTP_STATUS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { payload, needsRefresh } = await verifyAuthRequest(request);

    if (!payload) {
      return errorResponse('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED);
    }

    const response = NextResponse.json(
      successResponse({
        valid: true,
        userId: payload.userId,
        email: payload.email,
        refreshed: needsRefresh,
      })
    );

    if (needsRefresh) {
      const accessToken = generateAccessToken({ userId: payload.userId, email: payload.email });
      const refreshToken = generateRefreshToken({ userId: payload.userId, email: payload.email });
      setAuthCookies(response, accessToken, refreshToken);
    }

    return response;
  } catch (error) {
    logger.apiError('Token verification', error);
    return errorResponse('Token verification failed', HTTP_STATUS.UNAUTHORIZED);
  }
}
