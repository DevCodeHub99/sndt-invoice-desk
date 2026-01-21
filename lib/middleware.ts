import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthRequest, generateAccessToken, generateRefreshToken, setAuthCookies } from './auth';

/**
 * Enhanced Authentication Middleware
 * Handles token verification and automatic refresh
 * 
 * Usage for route handlers:
 * export const GET = withAuth(async (request, userId) => { ... });
 * 
 * Usage for dynamic routes with params:
 * export const GET = withAuth(async (request, userId, params) => { ... });
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, userId: string, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    const { payload, needsRefresh } = await verifyAuthRequest(request);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login again' },
        { status: 401 }
      );
    }

    // Execute the handler with userId and optional context (for dynamic routes)
    const response = await handler(request, payload.userId, context);

    // If token needs refresh, update cookies in response
    if (needsRefresh && response.ok) {
      const accessToken = generateAccessToken({
        userId: payload.userId,
        email: payload.email,
      });
      const refreshToken = generateRefreshToken({
        userId: payload.userId,
        email: payload.email,
      });
      setAuthCookies(response, accessToken, refreshToken);
    }

    return response;
  };
}

/**
 * Optional Authentication Middleware
 * Allows both authenticated and unauthenticated requests
 */
export function withOptionalAuth<T = any>(
  handler: (request: NextRequest, userId: string | null, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    const { payload, needsRefresh } = await verifyAuthRequest(request);

    const response = await handler(request, payload?.userId || null, context);

    // If token needs refresh and user is authenticated, update cookies
    if (needsRefresh && payload && response.ok) {
      const accessToken = generateAccessToken({
        userId: payload.userId,
        email: payload.email,
      });
      const refreshToken = generateRefreshToken({
        userId: payload.userId,
        email: payload.email,
      });
      setAuthCookies(response, accessToken, refreshToken);
    }

    return response;
  };
}

/**
 * CORS Middleware
 */
export function withCORS(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}
