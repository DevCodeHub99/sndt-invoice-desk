import { z } from 'zod';

// Helper for optional string that can be empty or null
const optionalString = z.string().optional().or(z.literal(''));

export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    price: z.coerce.number().min(0, 'Price must be non-negative'),
    hsnSac: optionalString,
});

export const clientSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    taxId: optionalString,
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: optionalString,
    billingAddress: z.string().min(1, 'Billing address is required'),
    billingCity: z.string().min(1, 'Billing city is required'),
    billingState: z.string().min(1, 'Billing state is required'),
    billingZipCode: z.string().min(1, 'Billing ZIP Code is required'),
    billingCountry: z.string().min(1, 'Billing country is required'),
    shippingSameAsBilling: z.boolean(),
    shippingAddress: optionalString,
    shippingCity: optionalString,
    shippingState: optionalString,
    shippingZipCode: optionalString,
    shippingCountry: optionalString,
}).refine((data) => {
    if (!data.shippingSameAsBilling) {
        // If shipping is different, fields are required
        return !!(data.shippingAddress && data.shippingCity && data.shippingState && data.shippingZipCode && data.shippingCountry);
    }
    return true;
}, {
    message: "Shipping address fields are required when not same as billing",
    path: ["shippingAddress"], // Attach error to one field
});

export const laborSchema = z.object({
    name: z.string().min(1, 'Labor name is required'),
    description: z.string().optional(),
    rateType: z.enum(['fixed', 'per_unit']),
    rate: z.coerce.number().min(0, 'Rate must be non-negative'),
    unit: optionalString,
});

export const invoiceItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
    taxRate: z.coerce.number().min(0, 'Tax rate must be non-negative'),
    comment: z.string().optional(),
});

export const manpowerItemSchema = z.object({
    laborId: optionalString,
    description: z.string().min(1, 'Description is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    amount: z.coerce.number().min(0, 'Amount must be non-negative'),
});

export const invoiceSchema = z.object({
    clientId: z.string().min(1, 'Client is required'),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
    manpowerCharges: z.array(manpowerItemSchema).optional(),
    notes: z.string().optional(),
    dueDate: z.coerce.date(),
    advancePayment: z.coerce.number().min(0).optional(),
});

export const businessDetailsSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    taxId: optionalString,
    registrationNumber: optionalString,
    municipalTradeCertificate: optionalString,
    email: z.string().email('Invalid email address'),
    phones: z.array(z.string()).optional(),
    billingAddress: z.string().min(1, 'Address is required'),
    billingCity: z.string().min(1, 'City is required'),
    billingState: z.string().min(1, 'State is required'),
    billingZipCode: z.string().min(1, 'ZIP Code is required'),
    billingCountry: z.string().min(1, 'Country is required'),
    website: optionalString,
    defaultTaxRate: z.coerce.number().min(0).max(100),
    bankName: optionalString,
    accountNumber: optionalString,
    ifscCode: optionalString,
    accountHolderName: optionalString,
    upiId: optionalString,
});
