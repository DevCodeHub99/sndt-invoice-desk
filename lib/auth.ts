import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { env, isProduction } from './env';

const JWT_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const SALT_ROUNDS = 10;

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT token interfaces
export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Generate access token (short-lived)
export function generateAccessToken(payload: { userId: string; email: string }): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

// Generate refresh token (long-lived)
export function generateRefreshToken(payload: { userId: string; email: string }): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type !== 'access') return null;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    if (decoded.type !== 'refresh') return null;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Extract tokens from request
export function getTokensFromRequest(request: NextRequest): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  // Check Authorization header for access token
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : request.cookies.get('access-token')?.value || null;

  // Get refresh token from cookie
  const refreshToken = request.cookies.get('refresh-token')?.value || null;

  return { accessToken, refreshToken };
}

// Set authentication cookies
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  // Set access token cookie (short-lived)
  response.cookies.set('access-token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  // Set refresh token cookie (long-lived)
  response.cookies.set('refresh-token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

// Clear authentication cookies
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete('access-token');
  response.cookies.delete('refresh-token');
}

// Verify authenticated request with auto-refresh
export async function verifyAuthRequest(
  request: NextRequest
): Promise<{ payload: JWTPayload | null; needsRefresh: boolean }> {
  const { accessToken, refreshToken } = getTokensFromRequest(request);

  // Try to verify access token
  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      return { payload, needsRefresh: false };
    }
  }

  // Access token invalid/expired, try refresh token
  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      return { payload, needsRefresh: true };
    }
  }

  return { payload: null, needsRefresh: false };
}

// Create authenticated response with token refresh
export function createAuthResponse(
  data: any,
  userId: string,
  email: string,
  status: number = 200
): NextResponse {
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, email });

  const response = NextResponse.json(data, { status });
  setAuthCookies(response, accessToken, refreshToken);

  return response;
}
