import mongoose, { Schema, Model } from 'mongoose';
import type { Product as ProductType } from '../types';

const ProductSchema = new Schema<ProductType>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true }, // User isolation
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  hsnSac: String,
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
ProductSchema.index({ userId: 1, name: 'text', description: 'text' });
ProductSchema.index({ userId: 1, createdAt: -1 });

export const ProductModel: Model<ProductType> = mongoose.models.Product || mongoose.model<ProductType>('Product', ProductSchema);
