export interface Product {
  id: string;
  userId: string; // User isolation
  name: string;
  description: string;
  price: number;
  hsnSac?: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  userId: string; // User isolation
  companyName: string;
  taxId?: string;
  email: string;
  phone: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
  billingCountry: string;
  shippingSameAsBilling: boolean;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  userId: string; // User isolation
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientGstin?: string;
  clientState?: string;
  placeOfSupply?: string;
  isInterState: boolean;
  items: InvoiceItem[];
  manpowerCharges?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>; // Labor costs without GST
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  manpowerTotal?: number; // Total manpower charges
  roundOff: number;
  total: number;
  advancePayment?: number; // Advance amount received from client
  balanceDue?: number; // Remaining amount after deducting advance
  status: 'pending' | 'paid' | 'partial'; // partial = advance received
  notes: string;
  createdAt: Date;
  dueDate: Date;
}

export interface DashboardStats {
  totalInvoicesThisMonth: number;
  totalRevenueThisMonth: number;
  pendingInvoices: number;
  totalClients: number;
}

export interface BusinessDetails {
  companyName: string;
  taxId?: string;
  registrationNumber?: string;
  municipalTradeCertificate?: string;
  email: string;
  phones: string[];
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
  billingCountry: string;
  website?: string;
  defaultTaxRate: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  upiId?: string; // UPI ID for payment QR code generation
}

export interface User {
  id: string;
  email: string;
  password: string;
  businessDetails?: BusinessDetails;
  isSetupComplete: boolean;
  createdAt: Date;
}

export interface Labor {
  id: string;
  userId: string;
  name: string;
  description: string;
  rateType: 'fixed' | 'per_unit'; // Fixed amount or per unit rate
  rate: number; // Rate per unit or fixed amount
  unit?: string; // e.g., "per brick", "per bag", "per hour"
  createdAt: Date;
}
