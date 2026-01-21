import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ClientModel } from '@/lib/models/Client';
import { withAuth } from '@/lib/middleware';
import { apiRateLimit } from '@/lib/rate-limit';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { sanitize } from '@/lib/validation';

// GET single client
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
      const client = await ClientModel.findOne({ id, userId }).lean();
      
      if (!client) {
        return errorResponse('Client not found', 404);
      }

      return successResponse({ client });
    } catch (error) {
      console.error('Get client error:', error);
      return errorResponse('Failed to fetch client');
    }
  })(request as NextRequest);
}

// PUT update client
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
      
      const client = await ClientModel.findOneAndUpdate(
        { id, userId },
        data,
        { new: true }
      ).lean();

      if (!client) {
        return errorResponse('Client not found', 404);
      }

      return successResponse({ client });
    } catch (error) {
      console.error('Update client error:', error);
      return errorResponse('Failed to update client');
    }
  })(request as NextRequest);
}

// DELETE client
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
      const client = await ClientModel.findOneAndDelete({ id, userId });

      if (!client) {
        return errorResponse('Client not found', 404);
      }

      return successResponse({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Delete client error:', error);
      return errorResponse('Failed to delete client');
    }
  })(request as NextRequest);
}
