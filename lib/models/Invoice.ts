import mongoose, { Schema, Model } from 'mongoose';
import type { Invoice as InvoiceType, InvoiceItem } from '../types';

const InvoiceItemSchema = new Schema<InvoiceItem>({
  id: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  description: { type: String, required: true },
  hsnSac: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema = new Schema<InvoiceType>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true }, // User isolation
  invoiceNumber: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  clientName: { type: String, required: true },
  clientAddress: { type: String, required: true },
  clientGstin: String,
  clientState: String,
  placeOfSupply: String,
  isInterState: { type: Boolean, default: false },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid'], 
    default: 'pending' 
  },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
});

// Add indexes for better query performance
InvoiceSchema.index({ userId: 1, invoiceNumber: 1 });
InvoiceSchema.index({ userId: 1, clientId: 1 });
InvoiceSchema.index({ userId: 1, status: 1 });
InvoiceSchema.index({ userId: 1, createdAt: -1 });
InvoiceSchema.index({ userId: 1, dueDate: 1 });

export const InvoiceModel: Model<InvoiceType> = mongoose.models.Invoice || mongoose.model<InvoiceType>('Invoice', InvoiceSchema);
