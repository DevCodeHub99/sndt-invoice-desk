import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { InvoiceModel } from '@/lib/models/Invoice';
import { v4 as uuidv4 } from 'uuid';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { getCurrentMonthRange } from '@/lib/invoice-retention';
import { errorResponse, successResponse, getPaginationParams } from '@/lib/api-helpers';
import { sanitize, validateRequired } from '@/lib/validation';
import { logger } from '@/lib/logger';

// GET all invoices (current month only) with pagination
export const GET = withAuth(async (request: NextRequest, userId: string) => {
  const rateLimitResponse = await apiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    
    const { start, end } = getCurrentMonthRange();
    const { page, limit, skip } = getPaginationParams(request);
    
    // Only get current month's invoices for this user
    const query = {
      userId,
      createdAt: { $gte: start, $lte: end }
    };
    
    const [invoices, total] = await Promise.all([
      InvoiceModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      InvoiceModel.countDocuments(query),
    ]);
    
    return successResponse(
      {
        invoices,
        month: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
      { page, limit, total }
    );
  } catch (error) {
    logger.apiError('Get invoices', error, { userId });
    return errorResponse('Failed to fetch invoices');
  }
});

// POST create invoice
export const POST = withAuth(async (request: NextRequest, userId: string) => {
  const rateLimitResponse = await apiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const rawData = await request.json();
    const data = sanitize(rawData);
    
    // Validate required fields
    const requiredFields = ['clientId', 'clientName', 'clientAddress', 'items', 'subtotal', 'total', 'dueDate'];
    const validation = validateRequired(data, requiredFields);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Validate items array
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return errorResponse('Invoice must have at least one item', 400);
    }

    // Generate invoice number (scoped to user)
    const year = new Date().getFullYear();
    const count = await InvoiceModel.countDocuments({
      userId,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    
    const invoice = await InvoiceModel.create({
      ...data,
      id: uuidv4(),
      userId,
      invoiceNumber,
      createdAt: new Date(),
    });

    return NextResponse.json(
      successResponse({ invoice }),
      { status: 201 }
    );
  } catch (error) {
    logger.apiError('Create invoice', error, { userId });
    return errorResponse('Failed to create invoice');
  }
});
