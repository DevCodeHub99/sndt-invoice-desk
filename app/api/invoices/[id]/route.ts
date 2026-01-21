import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { InvoiceModel } from '@/lib/models/Invoice';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { sanitize } from '@/lib/validation';

// GET single invoice
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return withAuth(async (req: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      const invoice = await InvoiceModel.findOne({ id, userId }).lean();
      
      if (!invoice) {
        return errorResponse('Invoice not found', 404);
      }

      return successResponse({ invoice });
    } catch (error) {
      console.error('Get invoice error:', error);
      return errorResponse('Failed to fetch invoice');
    }
  })(request as NextRequest);
}

// PUT update invoice
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return withAuth(async (req: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      const rawData = await req.json();
      const data = sanitize(rawData);
      
      const invoice = await InvoiceModel.findOneAndUpdate(
        { id, userId },
        data,
        { new: true }
      ).lean();

      if (!invoice) {
        return errorResponse('Invoice not found', 404);
      }

      return successResponse({ invoice });
    } catch (error) {
      console.error('Update invoice error:', error);
      return errorResponse('Failed to update invoice');
    }
  })(request as NextRequest);
}

// PATCH update invoice status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return withAuth(async (req: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      const { status } = await req.json();
      
      // Validate status
      if (!['pending', 'paid'].includes(status)) {
        return errorResponse('Invalid status value', 400);
      }
      
      const invoice = await InvoiceModel.findOneAndUpdate(
        { id, userId },
        { status },
        { new: true }
      ).lean();

      if (!invoice) {
        return errorResponse('Invoice not found', 404);
      }

      return successResponse({ invoice });
    } catch (error) {
      console.error('Update invoice status error:', error);
      return errorResponse('Failed to update invoice status');
    }
  })(request as NextRequest);
}

// DELETE invoice
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return withAuth(async (req: NextRequest, userId: string) => {
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await connectDB();
      const invoice = await InvoiceModel.findOneAndDelete({ id, userId });

      if (!invoice) {
        return errorResponse('Invoice not found', 404);
      }

      return successResponse({ message: 'Invoice deleted successfully' });
    } catch (error) {
      console.error('Delete invoice error:', error);
      return errorResponse('Failed to delete invoice');
    }
  })(request as NextRequest);
}
