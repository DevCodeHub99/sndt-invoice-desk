
import { getSession } from '@/lib/auth-server';
import { connectDB } from '@/lib/mongodb';
import { UserModel } from '@/lib/models/User';
import { InvoiceModel } from '@/lib/models/Invoice';
import InvoiceViewClient from './InvoiceViewClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await getSession();
  const { id } = await params;

  await connectDB();

  const [currentUser, invoice] = await Promise.all([
    UserModel.findOne({ id: userId }).lean(),
    InvoiceModel.findOne({ id, userId }).lean()
  ]);

  if (!currentUser) {
    redirect('/auth/login');
  }

  if (!invoice) {
    // If not found, ideally show not found page or redirect.
    // The previous client version showed a "Not Found" UI.
    // I can redirect to invoices list for now or keep it simple.
    redirect('/invoices');
  }

  // Serialize to JSON
  const serializedUser = JSON.parse(JSON.stringify(currentUser));
  const serializedInvoice = JSON.parse(JSON.stringify(invoice));

  return (
    <InvoiceViewClient
      invoice={serializedInvoice}
      currentUser={serializedUser}
    />
  );
}
