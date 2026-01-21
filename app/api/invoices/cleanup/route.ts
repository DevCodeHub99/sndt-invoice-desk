import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { InvoiceModel } from '@/lib/models/Invoice';
import { withAuth } from '@/lib/middleware';
import { strictRateLimit } from '@/lib/rate-limit';
import { getThreeMonthsAgoDate } from '@/lib/invoice-retention';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// DELETE old invoices (3+ months old) - only for current user
export const POST = withAuth(async (request: NextRequest, userId: string) => {
  const rateLimitResponse = await strictRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    
    const threeMonthsAgo = getThreeMonthsAgoDate();
    
    // Delete invoices older than 3 months - only for current user
    const result = await InvoiceModel.deleteMany({
      userId,
      createdAt: { $lt: threeMonthsAgo }
    });

    return successResponse({
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} invoices older than 3 months`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return errorResponse('Failed to cleanup old invoices');
  }
});
