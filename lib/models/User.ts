import mongoose, { Schema, Model } from 'mongoose';
import type { User as UserType, BusinessDetails } from '../types';

const BusinessDetailsSchema = new Schema<BusinessDetails>({
  companyName: { type: String, required: true },
  taxId: String,
  registrationNumber: String,
  municipalTradeCertificate: String,
  email: { type: String, required: true },
  phones: [String],
  billingAddress: { type: String, required: true },
  billingCity: { type: String, required: true },
  billingState: { type: String, required: true },
  billingZipCode: { type: String, required: true },
  billingCountry: { type: String, required: true },
  website: String,
  defaultTaxRate: { type: Number, default: 18 },
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  accountHolderName: String,
  upiId: String, // UPI ID for payment QR code generation
}, { _id: false });

const UserSchema = new Schema<UserType>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessDetails: BusinessDetailsSchema,
  isSetupComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel: Model<UserType> = mongoose.models.User || mongoose.model<UserType>('User', UserSchema);
