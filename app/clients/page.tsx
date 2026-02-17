
import { getSession } from '@/lib/auth-server';
import { connectDB } from '@/lib/mongodb';
import { ClientModel } from '@/lib/models/Client';
import ClientListClient from './ClientListClient';
import type { Client } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const { userId } = await getSession();

  await connectDB();

  const clients = await ClientModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const serializedClients = clients.map(doc => {
    const c = doc as unknown as Client & { _id: any };
    return {
      ...c,
      _id: c._id.toString(),
      createdAt: c.createdAt,
    };
  }) as Client[];

  return <ClientListClient initialClients={serializedClients} />;
}
