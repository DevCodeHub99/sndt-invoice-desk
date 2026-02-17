
import { getSession } from '@/lib/auth-server';
import { connectDB } from '@/lib/mongodb';
import { LaborModel } from '@/lib/models/Labor';
import LaborListClient from './LaborListClient';
import type { Labor } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LaborPage() {
  const { userId } = await getSession();

  await connectDB();

  const laborCharges = await LaborModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const serializedLaborCharges = laborCharges.map(doc => {
    // doc is basic object since we used lean() but type is loose because LaborModel didn't use generic in model() call in Labor.ts
    // We cast it.
    const l = doc as unknown as Labor & { _id: any };
    return {
      ...l,
      _id: l._id.toString(),
      createdAt: l.createdAt,
    };
  }) as Labor[];

  return <LaborListClient initialLaborCharges={serializedLaborCharges} />;
}
