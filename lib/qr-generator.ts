import QRCode from 'qrcode';

/**
 * UPI QR Code Generator
 * Generates QR codes for UPI payments in India
 */

export interface UPIPaymentDetails {
    upiId: string;
    payeeName: string;
    amount?: number;
    transactionNote?: string;
    transactionRef?: string;
}

/**
 * Generate UPI payment URI
 * Format: upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
 */
export function generateUPIPaymentURI(details: UPIPaymentDetails): string {
    const params = new URLSearchParams();

    // Required: Payee VPA (UPI ID)
    params.set('pa', details.upiId);

    // Required: Payee Name
    params.set('pn', details.payeeName);

    // Optional: Amount (if provided)
    if (details.amount && details.amount > 0) {
        params.set('am', details.amount.toFixed(2));
    }

    // Currency (always INR for Indian UPI)
    params.set('cu', 'INR');

    // Optional: Transaction Note
    if (details.transactionNote) {
        params.set('tn', details.transactionNote);
    }

    // Optional: Transaction Reference
    if (details.transactionRef) {
        params.set('tr', details.transactionRef);
    }

    return `upi://pay?${params.toString()}`;
}

/**
 * Generate QR code as Data URL (base64 encoded image)
 * This can be used in both browser preview and PDF generation
 */
export async function generateUPIQRCode(
    details: UPIPaymentDetails,
    options?: {
        width?: number;
        margin?: number;
        darkColor?: string;
        lightColor?: string;
    }
): Promise<string> {
    const upiURI = generateUPIPaymentURI(details);

    const qrOptions = {
        width: options?.width || 150,
        margin: options?.margin || 2,
        color: {
            dark: options?.darkColor || '#000000',
            light: options?.lightColor || '#ffffff',
        },
        errorCorrectionLevel: 'M' as const,
    };

    try {
        const dataUrl = await QRCode.toDataURL(upiURI, qrOptions);
        return dataUrl;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw new Error('Failed to generate UPI QR code');
    }
}

/**
 * Generate QR code synchronously (for server-side or immediate use)
 * Returns a Data URL string
 */
export function generateUPIQRCodeSync(
    details: UPIPaymentDetails,
    options?: {
        width?: number;
        margin?: number;
    }
): Promise<string> {
    return generateUPIQRCode(details, options);
}
