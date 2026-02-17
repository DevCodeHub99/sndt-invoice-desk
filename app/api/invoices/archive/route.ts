import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { InvoiceModel } from '@/lib/models/Invoice';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { getLastMonthRange } from '@/lib/utils';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// GET archived invoices (last month - basic details only)
export const GET = withAuth(async (request: NextRequest, userId: string) => {
  const rateLimitResponse = await apiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const { start, end } = getLastMonthRange();

    // Get last month's invoices with basic details only - filtered by userId
    const invoices = await InvoiceModel.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    })
      .select('id invoiceNumber clientName total status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({
      invoices,
      month: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      count: invoices.length,
    });
  } catch (error) {
    console.error('Get archived invoices error:', error);
    return errorResponse('Failed to fetch archived invoices');
  }
});
