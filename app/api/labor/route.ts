import { LaborModel } from '@/lib/models/Labor';
import { createCrudHandlers, errorResponse, successResponse } from '@/lib/api-helpers';
import { sanitize, validateRequired } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { connectDB } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Use generic CRUD handlers
const handlers = createCrudHandlers(LaborModel, 'labor', {
  requiredFields: ['name', 'rateType', 'rate'],
  userIdField: 'userId',
});

// GET all labor charges
export const GET = handlers.getAll;

// POST create labor charge
export const POST = withAuth(async (request: NextRequest, userId: string) => {
  const rateLimitResponse = await apiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const rawData = await request.json();
    const data = sanitize(rawData);

    // Validate required fields
    const validation = validateRequired(data, ['name', 'rateType', 'rate']);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Validate rateType
    if (!['fixed', 'per_unit'].includes(data.rateType)) {
      return errorResponse('Rate type must be either "fixed" or "per_unit"', 400);
    }

    // Validate rate is a positive number
    if (typeof data.rate !== 'number' || data.rate < 0) {
      return errorResponse('Rate must be a positive number', 400);
    }

    const labor = await LaborModel.create({
      ...data,
      id: uuidv4(),
      userId,
      createdAt: new Date(),
    });

    return NextResponse.json(
      successResponse({ labor }),
      { status: 201 }
    );
  } catch (error) {
    logger.apiError('Create labor', error, { userId });
    return errorResponse('Failed to create labor charge');
  }
});
