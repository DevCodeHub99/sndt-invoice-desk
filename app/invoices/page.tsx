import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { connectDB } from '@/lib/mongodb';
import { InvoiceModel } from '@/lib/models/Invoice';
import { getCurrentMonthRange, getLastMonthRange } from '@/lib/utils';
import InvoiceListClient from './InvoiceListClient';
import type { Invoice } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const { userId } = await getSession();

  await connectDB();

  // Fetch Current Month Invoices
  const { start: startCurrent, end: endCurrent } = getCurrentMonthRange();

  const invoices = await InvoiceModel.find({
    userId,
    createdAt: { $gte: startCurrent, $lte: endCurrent }
  })
    .sort({ createdAt: -1 })
    .lean();

  // Fetch Archived Invoices (Last Month)
  const { start: startLast, end: endLast } = getLastMonthRange();

  const archivedInvoices = await InvoiceModel.find({
    userId,
    createdAt: { $gte: startLast, $lte: endLast }
  })
    .select('id invoiceNumber clientName total status createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // Serialize Mongoose documents to plain objects compatible with Invoice type
  const serializedInvoices = invoices.map(doc => {
    const inv = doc as unknown as Invoice & { _id: any };
    return {
      ...inv,
      _id: inv._id.toString(), // Convert ObjectId to string just in case, though we rely on 'id'
      createdAt: inv.createdAt, // Date is serializable
      dueDate: inv.dueDate,
    };
  }) as Invoice[];

  const serializedArchived = archivedInvoices.map(doc => {
    const inv = doc as unknown as Invoice & { _id: any };
    return {
      ...inv,
      _id: inv._id.toString(),
      createdAt: inv.createdAt,
    };
  }) as Invoice[];

  return (
    <InvoiceListClient
      initialInvoices={serializedInvoices}
      initialArchivedInvoices={serializedArchived}
    />
  );
}
