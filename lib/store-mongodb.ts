'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Client, Invoice, User, BusinessDetails, Labor } from './types';

// ============================================================================
// SPLIT STORES - Prevent unnecessary re-renders
// ============================================================================

// Auth Store - Only auth state, never changes after login
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyAuth: () => Promise<boolean>;
  updateBusinessDetails: (businessDetails: Partial<BusinessDetails>) => Promise<boolean>;
}

// Products Store - Always fetch fresh data
interface ProductsState {
  products: Product[];
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
}

// Clients Store - Always fetch fresh data
interface ClientsState {
  clients: Client[];
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
}

// Labor Store - Always fetch fresh data
interface LaborState {
  laborCharges: Labor[];
  fetchLaborCharges: () => Promise<void>;
  addLaborCharge: (labor: Omit<Labor, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  updateLaborCharge: (id: string, labor: Partial<Labor>) => Promise<boolean>;
  deleteLaborCharge: (id: string) => Promise<boolean>;
}

// Invoices Store - Always fetch fresh data
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

// Generic API call helper
async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      return { ok: false, error: `Failed to parse response: ${response.statusText}` };
    }

    if (data.success !== undefined) {
      return {
        ok: data.success,
        data: data.success ? data.data || data : undefined,
        error: data.error
      };
    }

    if (response.ok) {
      return { ok: true, data, error: undefined };
    } else {
      return { ok: false, data: undefined, error: data.error || data.message || 'Request failed' };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// ============================================================================
// AUTH STORE - Minimal, persisted
// ============================================================================
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      loading: false,

      login: async (email: string, password: string) => {
        const { ok, data } = await apiCall<any>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (ok && data?.user) {
          set({ currentUser: data.user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: async () => {
        await apiCall('/api/auth/logout', { method: 'POST' });
        set({ currentUser: null, isAuthenticated: false });
        // Clear other stores
        useProductsStore.setState({ products: [] });
        useClientsStore.setState({ clients: [] });
        useLaborStore.setState({ laborCharges: [] });
        useInvoicesStore.setState({ invoices: [] });
      },

      verifyAuth: async () => {
        if (!get().isAuthenticated) {
          set({ currentUser: null, isAuthenticated: false });
          return false;
        }

        const { ok } = await apiCall('/api/auth/verify');

        if (!ok) {
          set({ currentUser: null, isAuthenticated: false });
          return false;
        }

        return true;
      },

      updateBusinessDetails: async (businessDetails: Partial<BusinessDetails>) => {
        const currentUser = get().currentUser;
        if (!currentUser) return false;

        const { ok, data } = await apiCall<any>(`/api/user/${currentUser.id}`, {
          method: 'PUT',
          body: JSON.stringify({ businessDetails }),
        });

        if (ok && data?.user) {
          set({ currentUser: data.user });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================================================
// Products Store - Always fetch fresh data, no caching
// ============================================================================
export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],

  fetchProducts: async () => {
    const { ok, data } = await apiCall<any>('/api/products');
    if (ok && data) {
      const products = data.products || [];
      set({ products });
    }
  },

  addProduct: async (product) => {
    const { ok } = await apiCall('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    if (ok) {
      // Refetch to get the latest data
      await get().fetchProducts();
    }
    return ok;
  },

  updateProduct: async (id, product) => {
    const { ok } = await apiCall(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    if (ok) {
      // Refetch to get the latest data
      await get().fetchProducts();
    }
    return ok;
  },

  deleteProduct: async (id) => {
    const { ok } = await apiCall(`/api/products/${id}`, { method: 'DELETE' });
    if (ok) {
      // Refetch to get the latest data
      await get().fetchProducts();
    }
    return ok;
  },
}));

// ============================================================================
// Clients Store - Always fetch fresh data, no caching
// ============================================================================
export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],

  fetchClients: async () => {
    const { ok, data } = await apiCall<any>('/api/clients');
    if (ok && data) {
      const clients = data.clients || [];
      set({ clients });
    }
  },

  addClient: async (client) => {
    const { ok } = await apiCall('/api/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
    if (ok) {
      // Refetch to get the latest data
      await get().fetchClients();
    }
    return ok;
  },

  updateClient: async (id, client) => {
    const { ok } = await apiCall(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
    if (ok) {
      // Refetch to get the latest data
      await get().fetchClients();
    }
    return ok;
  },

  deleteClient: async (id) => {
    const { ok } = await apiCall(`/api/clients/${id}`, { method: 'DELETE' });
    if (ok) {
      // Refetch to get the latest data
      await get().fetchClients();
    }
    return ok;
  },
}));

// ============================================================================
// Invoices Store - Always fetch fresh data, no caching
// ============================================================================
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


// ============================================================================
// Labor Store - Always fetch fresh data, no caching
// ============================================================================
export const useLaborStore = create<LaborState>((set, get) => ({
  laborCharges: [],

  fetchLaborCharges: async () => {
    const { ok, data } = await apiCall<any>('/api/labor');
    if (ok && data) {
      const laborCharges = data.labor || [];
      set({ laborCharges });
    }
  },

  addLaborCharge: async (labor) => {
    const { ok } = await apiCall('/api/labor', {
      method: 'POST',
      body: JSON.stringify(labor),
    });
    if (ok) {
      await get().fetchLaborCharges();
    }
    return ok;
  },

  updateLaborCharge: async (id, labor) => {
    const { ok } = await apiCall(`/api/labor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(labor),
    });
    if (ok) {
      await get().fetchLaborCharges();
    }
    return ok;
  },

  deleteLaborCharge: async (id) => {
    const { ok } = await apiCall(`/api/labor/${id}`, { method: 'DELETE' });
    if (ok) {
      await get().fetchLaborCharges();
    }
    return ok;
  },
}));
