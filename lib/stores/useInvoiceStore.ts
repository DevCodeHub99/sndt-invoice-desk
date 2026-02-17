import { create } from 'zustand';
import { apiCall } from '../api-client';
import type { Invoice } from '../types';

interface InvoicesState {
    invoices: Invoice[];
    archivedInvoices: Partial<Invoice>[];
    fetchInvoices: () => Promise<void>;
    fetchArchivedInvoices: () => Promise<void>;
    addInvoice: (invoice: Omit<Invoice, 'id' | 'userId' | 'invoiceNumber' | 'createdAt'>) => Promise<boolean>;
    updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<boolean>;
    updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<boolean>;
    deleteInvoice: (id: string) => Promise<boolean>;
    downloadArchivedInvoices: () => Promise<void>;
    downloadArchivedInvoicesJSON: () => Promise<void>;
    cleanupOldInvoices: () => Promise<boolean>;
    getNextInvoiceNumber: () => string;
    getRecentInvoices: () => Invoice[];
}

export const useInvoicesStore = create<InvoicesState>((set, get) => ({
    invoices: [],
    archivedInvoices: [],

    fetchInvoices: async () => {
        const { ok, data } = await apiCall<any>('/api/invoices');
        if (ok && data) {
            const invoices = data.invoices || [];
            set({ invoices });
        }
    },

    fetchArchivedInvoices: async () => {
        const { ok, data } = await apiCall<any>('/api/invoices/archive');
        if (ok && data) {
            const invoices = data.invoices || [];
            set({ archivedInvoices: invoices });
        }
    },

    addInvoice: async (invoice) => {
        const { ok } = await apiCall('/api/invoices', {
            method: 'POST',
            body: JSON.stringify(invoice),
        });
        if (ok) {
            // Refetch to get the latest data
            await get().fetchInvoices();
        }
        return ok;
    },

    updateInvoice: async (id, invoice) => {
        const { ok } = await apiCall(`/api/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(invoice),
        });
        if (ok) {
            // Refetch to get the latest data
            await get().fetchInvoices();
        }
        return ok;
    },

    updateInvoiceStatus: async (id, status) => {
        const { ok } = await apiCall(`/api/invoices/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        if (ok) {
            // Refetch to get the latest data
            await get().fetchInvoices();
        }
        return ok;
    },

    deleteInvoice: async (id) => {
        const { ok } = await apiCall(`/api/invoices/${id}`, { method: 'DELETE' });
        if (ok) {
            // Refetch to get the latest data
            await get().fetchInvoices();
        }
        return ok;
    },

    downloadArchivedInvoices: async () => {
        try {
            const response = await fetch('/api/invoices/archive/download', { credentials: 'include' });
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoices-${new Date().toISOString().slice(0, 7)}.csv`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    },

    downloadArchivedInvoicesJSON: async () => {
        try {
            const response = await fetch('/api/invoices/archive/download-json', { credentials: 'include' });
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoices-${new Date().toISOString().slice(0, 7)}.json`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    },

    cleanupOldInvoices: async () => {
        const { ok } = await apiCall('/api/invoices/cleanup', { method: 'POST' });
        return ok;
    },

    getNextInvoiceNumber: () => {
        const invoices = get().invoices;
        const year = new Date().getFullYear();
        const count = invoices.filter(
            (inv) => new Date(inv.createdAt).getFullYear() === year
        ).length;
        return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    },

    getRecentInvoices: () => get().invoices.slice(0, 10),
}));
