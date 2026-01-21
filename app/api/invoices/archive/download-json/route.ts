import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { InvoiceModel } from '@/lib/models/Invoice';
import { withAuth } from '@/lib/middleware';
import { strictRateLimit } from '@/lib/rate-limit';
import { getLastMonthRange } from '@/lib/invoice-retention';
import { errorResponse } from '@/lib/api-helpers';

// GET bulk download of last month's invoices as JSON - filtered by userId
export const GET = withAuth(async (request: NextRequest, userId: string) => {
  const rateLimitResponse = await strictRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    
    const { start, end } = getLastMonthRange();
    
    // Get all last month's invoices with full details - filtered by userId
    const invoices = await InvoiceModel.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: -1 }).lean();

    // Convert to JSON with metadata
    const exportData = {
      exportDate: new Date().toISOString(),
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      },
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      invoices: invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        id: inv.id,
        date: inv.createdAt,
        dueDate: inv.dueDate,
        client: {
          name: inv.clientName,
          gstin: inv.clientGstin,
          address: inv.clientAddress,
          state: inv.clientState,
        },
        placeOfSupply: inv.placeOfSupply,
        isInterState: inv.isInterState,
        amounts: {
          subtotal: inv.subtotal,
          cgst: inv.cgst,
          sgst: inv.sgst,
          igst: inv.igst,
          roundOff: inv.roundOff,
          total: inv.total,
        },
        status: inv.status,
        items: inv.items?.map(item => ({
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          total: item.total,
        })) || [],
        notes: inv.notes,
      }))
    };
    
    const json = JSON.stringify(exportData, null, 2);
    
    const monthLabel = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const filename = `invoices-${monthLabel.replace(' ', '-')}.json`;

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Bulk download JSON error:', error);
    return errorResponse('Failed to download archived invoices');
  }
});
