'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Client, Invoice, User, BusinessDetails } from './types';

// ============================================================================
// SPLIT STORES - Prevent unnecessary re-renders
// ============================================================================

// Auth Store - Only auth state, never changes after login
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyAuth: () => Promise<boolean>;
  updateBusinessDetails: (details: BusinessDetails) => Promise<void>;
  completeSetup: () => Promise<void>;
}

// Products Store - Isolated, only loads when needed
interface ProductsState {
  products: Product[];
  isLoaded: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

// Clients Store - Isolated, only loads when needed
interface ClientsState {
  clients: Client[];
  isLoaded: boolean;
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

// Invoices Store - Isolated, only loads when needed
interface InvoicesState {
  invoices: Invoice[];
  archivedInvoices: Partial<Invoice>[];
  isLoaded: boolean;
  fetchInvoices: () => Promise<void>;
  fetchArchivedInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'userId' | 'invoiceNumber' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
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

      register: async (email: string, password: string) => {
        const { ok, data } = await apiCall<any>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (ok && data?.user) {
          set({ currentUser: data.user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      login: async (email: string, password: string) => {
        const { ok, data } = await apiCall<any>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (ok && data?.user) {
          set({ currentUser: data.user, isAuthenticated: true });
          // ✅ GOOD: Don't load data here, let pages load what they need
          return true;
        }
        return false;
      },

      logout: async () => {
        await apiCall('/api/auth/logout', { method: 'POST' });
        set({ currentUser: null, isAuthenticated: false });
        // Clear other stores
        useProductsStore.getState().products = [];
        useProductsStore.getState().isLoaded = false;
        useClientsStore.getState().clients = [];
        useClientsStore.getState().isLoaded = false;
        useInvoicesStore.getState().invoices = [];
        useInvoicesStore.getState().isLoaded = false;
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

      updateBusinessDetails: async (details: BusinessDetails) => {
        const user = get().currentUser;
        if (!user) return;

        const { ok, data } = await apiCall<any>(`/api/user/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify({ businessDetails: details }),
        });

        if (ok && data?.user) {
          set({ currentUser: data.user });
        }
      },

      completeSetup: async () => {
        const user = get().currentUser;
        if (!user) return;

        const { ok, data } = await apiCall<any>(`/api/user/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify({ isSetupComplete: true }),
        });

        if (ok && data?.user) {
          set({ currentUser: data.user });
        }
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
// PRODUCTS STORE - Lazy loaded
// ============================================================================
export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoaded: false,

  fetchProducts: async () => {
    if (get().isLoaded) return; // ✅ Cache: Don't refetch if already loaded
    
    const { ok, data } = await apiCall<any>('/api/products');
    if (ok && data) {
      const products = data.products || data.data?.products || [];
      set({ products, isLoaded: true });
    }
  },

  addProduct: async (product) => {
    const { ok } = await apiCall('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    if (ok) await get().fetchProducts();
  },

  updateProduct: async (id, product) => {
    const { ok } = await apiCall(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    if (ok) {
      // ✅ Optimistic update instead of refetch
      set(state => ({
        products: state.products.map(p => p.id === id ? { ...p, ...product } : p)
      }));
    }
  },

  deleteProduct: async (id) => {
    const { ok } = await apiCall(`/api/products/${id}`, { method: 'DELETE' });
    if (ok) {
      // ✅ Optimistic update
      set(state => ({
        products: state.products.filter(p => p.id !== id)
      }));
    }
  },
}));

// ============================================================================
// CLIENTS STORE - Lazy loaded
// ============================================================================
export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  isLoaded: false,

  fetchClients: async () => {
    if (get().isLoaded) return;
    
    const { ok, data } = await apiCall<any>('/api/clients');
    if (ok && data) {
      const clients = data.clients || data.data?.clients || [];
      set({ clients, isLoaded: true });
    }
  },

  addClient: async (client) => {
    const { ok } = await apiCall('/api/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
    if (ok) await get().fetchClients();
  },

  updateClient: async (id, client) => {
    const { ok } = await apiCall(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
    if (ok) {
      set(state => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...client } : c)
      }));
    }
  },

  deleteClient: async (id) => {
    const { ok } = await apiCall(`/api/clients/${id}`, { method: 'DELETE' });
    if (ok) {
      set(state => ({
        clients: state.clients.filter(c => c.id !== id)
      }));
    }
  },
}));

// ============================================================================
// INVOICES STORE - Lazy loaded
// ============================================================================
export const useInvoicesStore = create<InvoicesState>((set, get) => ({
  invoices: [],
  archivedInvoices: [],
  isLoaded: false,

  fetchInvoices: async () => {
    if (get().isLoaded) return;
    
    const { ok, data } = await apiCall<any>('/api/invoices');
    if (ok && data) {
      const invoices = data.invoices || data.data?.invoices || [];
      set({ invoices, isLoaded: true });
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
      set({ isLoaded: false }); // Force refetch
      await get().fetchInvoices();
    }
  },

  updateInvoice: async (id, invoice) => {
    const { ok } = await apiCall(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    });
    if (ok) {
      set(state => ({
        invoices: state.invoices.map(inv => inv.id === id ? { ...inv, ...invoice } : inv)
      }));
    }
  },

  updateInvoiceStatus: async (id, status) => {
    const { ok } = await apiCall(`/api/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (ok) {
      set(state => ({
        invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
      }));
    }
  },

  deleteInvoice: async (id) => {
    const { ok } = await apiCall(`/api/invoices/${id}`, { method: 'DELETE' });
    if (ok) {
      set(state => ({
        invoices: state.invoices.filter(inv => inv.id !== id)
      }));
    }
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
