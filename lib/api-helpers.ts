import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from './mongodb';
import { withAuth } from './middleware';
import { apiRateLimit } from './rate-limit';
import { Model } from 'mongoose';
import { logger } from './logger';
import { PAGINATION, HTTP_STATUS } from './constants';
import { sanitize, validateRequired } from './validation';

/**
 * Standardized API Response Format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, meta?: ApiResponse['meta']): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta && { meta }) });
}

/**
 * Create error response
 */
export function errorResponse(error: string, status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Parse pagination params
 */
export function getPaginationParams(request: NextRequest): {
  page: number;
  limit: number;
  skip: number;
} {
  const url = new URL(request.url);
  const page = Math.max(PAGINATION.MIN_PAGE_SIZE, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(
    PAGINATION.MAX_PAGE_SIZE, 
    Math.max(PAGINATION.MIN_PAGE_SIZE, parseInt(url.searchParams.get('limit') || String(PAGINATION.DEFAULT_PAGE_SIZE)))
  );
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

/**
 * Generic CRUD Handler Factory
 * Eliminates code duplication across API routes
 */
export function createCrudHandlers<T extends { id: string; createdAt: Date }>(
  model: Model<T>,
  resourceName: string,
  options: {
    requiredFields?: (keyof T)[];
    userIdField?: keyof T;
  } = {}
) {
  const { requiredFields = [], userIdField } = options;

  // GET all resources
  const getAll = withAuth(async (request: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      
      const { page, limit, skip } = getPaginationParams(request);
      const query = userIdField ? { [userIdField]: userId } : {};
      
      const [items, total] = await Promise.all([
        model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        model.countDocuments(query),
      ]);

      return successResponse({ [resourceName]: items }, { page, limit, total });
    } catch (error) {
      logger.apiError(`Get ${resourceName}`, error, { userId });
      return errorResponse(`Failed to fetch ${resourceName}`);
    }
  });

  // POST create resource
  const create = withAuth(async (request: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      const data = sanitize(await request.json());

      // Validate required fields
      if (requiredFields.length > 0) {
        const validation = validateRequired(data, requiredFields);
        if (!validation.valid) {
          return errorResponse(
            `Missing required fields: ${validation.missing?.join(', ')}`,
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }

      // Add user ID if configured
      if (userIdField) data[userIdField] = userId;

      const item = await model.create(data);
      return NextResponse.json(
        successResponse({ [resourceName.slice(0, -1)]: item }),
        { status: HTTP_STATUS.CREATED }
      );
    } catch (error) {
      logger.apiError(`Create ${resourceName}`, error, { userId });
      return errorResponse(`Failed to create ${resourceName.slice(0, -1)}`);
    }
  });

  // GET single resource
  const getOne = withAuth(async (
    request: NextRequest,
    userId: string,
    context?: { params: { id: string } }
  ) => {
    const rateLimitResponse = await apiRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    if (!context?.params?.id) {
      return errorResponse('Resource ID is required', HTTP_STATUS.BAD_REQUEST);
    }

    try {
      await connectDB();
      
      const query: any = { id: context.params.id };
      if (userIdField) query[userIdField] = userId;
      
      const item = await model.findOne(query).lean();

      if (!item) {
        return errorResponse(`${resourceName.slice(0, -1)} not found`, HTTP_STATUS.NOT_FOUND);
      }

      return successResponse({ [resourceName.slice(0, -1)]: item });
    } catch (error) {
      logger.apiError(`Get ${resourceName}`, error, { userId, id: context.params.id });
      return errorResponse(`Failed to fetch ${resourceName.slice(0, -1)}`);
    }
  });

  // PUT update resource
  const update = withAuth(async (
    request: NextRequest,
    userId: string,
    context?: { params: { id: string } }
  ) => {
    const rateLimitResponse = await apiRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    if (!context?.params?.id) {
      return errorResponse('Resource ID is required', HTTP_STATUS.BAD_REQUEST);
    }

    try {
      await connectDB();
      const data = sanitize(await request.json());

      const query: any = { id: context.params.id };
      if (userIdField) query[userIdField] = userId;

      const item = await model.findOneAndUpdate(query, data, { new: true }).lean();

      if (!item) {
        return errorResponse(`${resourceName.slice(0, -1)} not found`, HTTP_STATUS.NOT_FOUND);
      }

      return successResponse({ [resourceName.slice(0, -1)]: item });
    } catch (error) {
      logger.apiError(`Update ${resourceName}`, error, { userId, id: context.params.id });
      return errorResponse(`Failed to update ${resourceName.slice(0, -1)}`);
    }
  });

  // DELETE resource
  const remove = withAuth(async (
    request: NextRequest,
    userId: string,
    context?: { params: { id: string } }
  ) => {
    const rateLimitResponse = await apiRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    if (!context?.params?.id) {
      return errorResponse('Resource ID is required', HTTP_STATUS.BAD_REQUEST);
    }

    try {
      await connectDB();
      
      const query: any = { id: context.params.id };
      if (userIdField) query[userIdField] = userId;

      const item = await model.findOneAndDelete(query);

      if (!item) {
        return errorResponse(`${resourceName.slice(0, -1)} not found`, HTTP_STATUS.NOT_FOUND);
      }

      return successResponse({ message: `${resourceName.slice(0, -1)} deleted successfully` });
    } catch (error) {
      logger.apiError(`Delete ${resourceName}`, error, { userId, id: context.params.id });
      return errorResponse(`Failed to delete ${resourceName.slice(0, -1)}`);
    }
  });

  return { getAll, create, getOne, update, remove };
}
