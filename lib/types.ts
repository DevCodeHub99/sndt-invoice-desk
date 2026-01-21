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
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  total: number;
  status: 'pending' | 'paid';
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
}

export interface User {
  id: string;
  email: string;
  password: string;
  businessDetails?: BusinessDetails;
  isSetupComplete: boolean;
  createdAt: Date;
}
