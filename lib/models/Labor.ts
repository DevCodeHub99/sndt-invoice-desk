import mongoose from 'mongoose';

const LaborSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  rateType: { type: String, enum: ['fixed', 'per_unit'], required: true },
  rate: { type: Number, required: true }, // Rate per unit or fixed amount
  unit: { type: String, default: '' }, // e.g., "per brick", "per bag", "per hour"
  createdAt: { type: Date, default: Date.now },
});

// Compound index for user isolation
LaborSchema.index({ userId: 1, id: 1 });

export const LaborModel = mongoose.models.Labor || mongoose.model('Labor', LaborSchema);
