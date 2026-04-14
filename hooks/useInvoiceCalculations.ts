import { useMemo } from 'react';
import { getStateFromGSTIN } from '@/lib/utils';
import type { Product, Client, InvoiceItem, BusinessDetails } from '@/lib/types';

export interface LineItemInput {
    id: string;
    productId: string;
    comment: string;
    quantity: number | string;
    unitPrice: number | string;
    taxRate: number;
}

export interface ManpowerItemInput {
    id: string;
    laborId?: string;
    description: string;
    quantity?: number | string;
    amount: number | string;
}

interface UseInvoiceCalculationsProps {
    lineItems: LineItemInput[];
    manpowerItems: ManpowerItemInput[];
    selectedClient?: Client;
    businessDetails?: BusinessDetails;
    products: Product[];
    advancePayment?: string | number;
}

export function useInvoiceCalculations({
    lineItems,
    manpowerItems,
    selectedClient,
    businessDetails,
    products,
    advancePayment = 0,
}: UseInvoiceCalculationsProps) {

    const invoiceItems: InvoiceItem[] = useMemo(() => {
        return lineItems
            .filter((item) => item.productId)
            .map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;

                // Use custom price if set, otherwise use product price
                // Convert string to number, default to 0 if empty
                const unitPrice = typeof item.unitPrice === 'string'
                    ? (parseFloat(item.unitPrice) || 0)
                    : (item.unitPrice || product.price);

                const quantity = typeof item.quantity === 'string'
                    ? (parseInt(item.quantity) || 1)
                    : (item.quantity || 1);

                const itemSubtotal = quantity * unitPrice;
                const itemTax = itemSubtotal * (item.taxRate / 100);

                return {
                    id: item.id,
                    productId: product.id,
                    productName: product.name,
                    description: item.comment.trim() || product.description || product.name,
                    hsnSac: product.hsnSac,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    taxRate: item.taxRate,
                    total: itemSubtotal + itemTax,
                };
            })
            .filter(Boolean) as InvoiceItem[];
    }, [lineItems, products]);

    const totals = useMemo(() => {
        let subtotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;

        // Get states from GSTIN (first 2 digits)
        const businessState = getStateFromGSTIN(businessDetails?.taxId);
        const clientState = getStateFromGSTIN(selectedClient?.taxId);

        // Check if inter-state transaction
        const isInterState = !!(businessState && clientState && businessState !== clientState);

        invoiceItems.forEach((item) => {
            const quantity = typeof item.quantity === 'string'
                ? (parseInt(item.quantity as unknown as string) || 1)
                : (item.quantity || 1);

            const itemSubtotal = quantity * item.unitPrice;
            subtotal += itemSubtotal;

            if (isInterState) {
                // Inter-state: Apply IGST
                const itemIgst = itemSubtotal * (item.taxRate / 100);
                totalIgst += itemIgst;
            } else {
                // Intra-state: Apply CGST + SGST (split equally)
                const itemCgst = itemSubtotal * (item.taxRate / 200);
                const itemSgst = itemSubtotal * (item.taxRate / 200);
                totalCgst += itemCgst;
                totalSgst += itemSgst;
            }
        });

        // Round intermediate results to 2 decimals to avoid floating point drift
        subtotal = Math.round(subtotal * 100) / 100;
        totalCgst = Math.round(totalCgst * 100) / 100;
        totalSgst = Math.round(totalSgst * 100) / 100;
        totalIgst = Math.round(totalIgst * 100) / 100;

        // Add manpower charges (no tax) - price × quantity
        const manpowerTotal = Math.round(manpowerItems.reduce((sum, item) => {
            const price = typeof item.amount === 'string'
                ? (parseFloat(item.amount) || 0)
                : (item.amount || 0);
            const quantity = typeof item.quantity === 'string'
                ? (parseInt(item.quantity) || 1)
                : (item.quantity || 1);
            return sum + (price * quantity);
        }, 0) * 100) / 100;

        const totalTax = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
        const total = Math.round((subtotal + totalTax + manpowerTotal) * 100) / 100;
        const finalTotal = total;
        const roundOff = 0;

        // Calculate advance payment and balance due
        const advance = typeof advancePayment === 'string'
            ? (parseFloat(advancePayment) || 0)
            : (advancePayment || 0);

        const balanceDue = Math.max(0, Math.round((finalTotal - advance) * 100) / 100);

        return {
            subtotal,
            cgst: totalCgst,
            sgst: totalSgst,
            igst: totalIgst,
            manpowerTotal,
            roundOff,
            total: finalTotal,
            advancePayment: advance,
            balanceDue,
            isInterState,
            businessState,
            clientState
        };
    }, [invoiceItems, manpowerItems, selectedClient, businessDetails, advancePayment]);

    return { invoiceItems, totals };
}
