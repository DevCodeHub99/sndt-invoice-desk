
import { getSession } from '@/lib/auth-server';
import { connectDB } from '@/lib/mongodb';
import { UserModel } from '@/lib/models/User';
import { ClientModel } from '@/lib/models/Client';
import { ProductModel } from '@/lib/models/Product';
import { LaborModel } from '@/lib/models/Labor';
import NewInvoiceClient from './NewInvoiceClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const { userId } = await getSession();

  await connectDB();

  const [currentUser, clients, products, laborCharges] = await Promise.all([
    UserModel.findOne({ id: userId }).lean(),
    ClientModel.find({ userId }).sort({ createdAt: -1 }).lean(),
    ProductModel.find({ userId }).sort({ createdAt: -1 }).lean(),
    LaborModel.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!currentUser) {
    redirect('/auth/login');
  }

  // Serialize to JSON to handle Dates and undefined
  const serializedUser = JSON.parse(JSON.stringify(currentUser));
  const serializedClients = JSON.parse(JSON.stringify(clients));
  const serializedProducts = JSON.parse(JSON.stringify(products));
  const serializedLaborCharges = JSON.parse(JSON.stringify(laborCharges));

  return (
    <NewInvoiceClient
      currentUser={serializedUser}
      clients={serializedClients}
      products={serializedProducts}
      laborCharges={serializedLaborCharges}
    />
  );
}
