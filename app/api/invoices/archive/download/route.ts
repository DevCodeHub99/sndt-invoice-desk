import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { InvoiceModel } from '@/lib/models/Invoice';
import { withAuth } from '@/lib/middleware';
import { strictRateLimit } from '@/lib/rate-limit';
import { getLastMonthRange } from '@/lib/invoice-retention';
import { errorResponse } from '@/lib/api-helpers';

// GET bulk download of last month's invoices - filtered by userId
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

    // Convert to comprehensive CSV format
    const csvHeader = [
      'Invoice Number',
      'Date',
      'Due Date',
      'Client Name',
      'Client GSTIN',
      'Client Address',
      'Client State',
      'Place of Supply',
      'Is Inter-State',
      'Subtotal',
      'CGST',
      'SGST',
      'IGST',
      'Round Off',
      'Total Amount',
      'Status',
      'Items Count',
      'Item Details',
      'Notes'
    ].join(',') + '\n';
    
    const csvRows = invoices.map(inv => {
      const date = new Date(inv.createdAt).toLocaleDateString('en-IN');
      const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'N/A';
      const itemsCount = inv.items?.length || 0;
      
      // Format item details
      const itemDetails = inv.items?.map(item => 
        `${item.productName} (Qty: ${item.quantity} @ ₹${item.unitPrice})`
      ).join('; ') || 'N/A';
      
      // Escape and format fields
      const escape = (str: unknown) => {
        if (str === null || str === undefined) return '';
        const s = String(str);
        return s.includes(',') || s.includes('"') || s.includes('\n') 
          ? `"${s.replace(/"/g, '""')}"` 
          : s;
      };

      return [
        escape(inv.invoiceNumber),
        escape(date),
        escape(dueDate),
        escape(inv.clientName),
        escape(inv.clientGstin || 'N/A'),
        escape(inv.clientAddress || 'N/A'),
        escape(inv.clientState || 'N/A'),
        escape(inv.placeOfSupply || 'N/A'),
        escape(inv.isInterState ? 'Yes' : 'No'),
        escape(inv.subtotal?.toFixed(2) || '0.00'),
        escape(inv.cgst?.toFixed(2) || '0.00'),
        escape(inv.sgst?.toFixed(2) || '0.00'),
        escape(inv.igst?.toFixed(2) || '0.00'),
        escape(inv.roundOff?.toFixed(2) || '0.00'),
        escape(inv.total?.toFixed(2) || '0.00'),
        escape(inv.status || 'pending'),
        escape(itemsCount),
        escape(itemDetails),
        escape(inv.notes || '')
      ].join(',');
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    const monthLabel = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const filename = `invoices-${monthLabel.replace(' ', '-')}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Bulk download error:', error);
    return errorResponse('Failed to download archived invoices');
  }
});
