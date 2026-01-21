import { ClientModel } from '@/lib/models/Client';
import { createCrudHandlers, errorResponse, successResponse } from '@/lib/api-helpers';
import { sanitize, validateRequired } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { connectDB } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Use generic CRUD handlers
const handlers = createCrudHandlers(ClientModel, 'clients', {
  requiredFields: ['companyName', 'email', 'phone', 'billingAddress', 'billingCity', 'billingState', 'billingZipCode', 'billingCountry'],
  userIdField: 'userId',
});

// GET all clients with pagination
export const GET = handlers.getAll;

// POST create client
export const POST = withAuth(async (request: NextRequest, userId: string) => {
  const rateLimitResponse = await apiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const rawData = await request.json();
    const data = sanitize(rawData);

    // Validate required fields
    const requiredFields = ['companyName', 'email', 'phone', 'billingAddress', 'billingCity', 'billingState', 'billingZipCode', 'billingCountry'];
    const validation = validateRequired(data, requiredFields);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return errorResponse('Invalid email format', 400);
    }

    const client = await ClientModel.create({
      ...data,
      id: uuidv4(),
      userId,
      createdAt: new Date(),
    });

    return NextResponse.json(
      successResponse({ client }),
      { status: 201 }
    );
  } catch (error) {
    logger.apiError('Create client', error, { userId });
    return errorResponse('Failed to create client');
  }
});
