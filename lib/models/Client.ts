import mongoose, { Schema, Model } from 'mongoose';
import type { Client as ClientType } from '../types';

const ClientSchema = new Schema<ClientType>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true }, // User isolation
  companyName: { type: String, required: true },
  taxId: String,
  email: { type: String, required: true },
  phone: { type: String, required: true },
  billingAddress: { type: String, required: true },
  billingCity: { type: String, required: true },
  billingState: { type: String, required: true },
  billingZipCode: { type: String, required: true },
  billingCountry: { type: String, required: true },
  shippingSameAsBilling: { type: Boolean, default: true },
  shippingAddress: String,
  shippingCity: String,
  shippingState: String,
  shippingZipCode: String,
  shippingCountry: String,
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
ClientSchema.index({ userId: 1, companyName: 'text', email: 'text' });
ClientSchema.index({ userId: 1, createdAt: -1 });

export const ClientModel: Model<ClientType> = mongoose.models.Client || mongoose.model<ClientType>('Client', ClientSchema);
