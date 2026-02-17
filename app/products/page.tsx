import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { connectDB } from '@/lib/mongodb';
import { ProductModel } from '@/lib/models/Product';
import ProductListClient from './ProductListClient';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { userId } = await getSession();

  await connectDB();

  const products = await ProductModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const serializedProducts = products.map(doc => {
    const p = doc as unknown as Product & { _id: any };
    return {
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt,
    };
  }) as Product[];

  return <ProductListClient initialProducts={serializedProducts} />;
}
