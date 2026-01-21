'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Client, Invoice, User, BusinessDetails } from './types';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Data
  products: Product[];
  clients: Client[];
  invoices: Invoice[];
  archivedInvoices: Partial<Invoice>[];
  
  // Auth actions
  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyAuth: () => Promise<boolean>;
  updateBusinessDetails: (details: BusinessDetails) => Promise<void>;
  completeSetup: () => Promise<void>;
  
  // CRUD actions
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  fetchInvoices: () => Promise<void>;
  fetchArchivedInvoices: () => Promise<void>;
  downloadArchivedInvoices: () => Promise<void>;
  downloadArchivedInvoicesJSON: () => Promise<void>;
  cleanupOldInvoices: () => Promise<boolean>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'userId' | 'invoiceNumber' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Helpers
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

    // Try to parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      return { 
        ok: false, 
        error: `Failed to parse response: ${response.statusText}` 
      };
    }
    
    // Handle new standardized API response format
    if (data.success !== undefined) {
      return { 
        ok: data.success, 
        data: data.success ? data.data || data : undefined, 
        error: data.error 
      };
    }
    
    // Handle legacy format
    if (response.ok) {
      return { ok: true, data, error: undefined };
    } else {
      return { ok: false, data: undefined, error: data.error || data.message || 'Request failed' };
    }
  } catch (error) {
    console.error('API call error:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

// Generic CRUD operations factory
function createCrudActions<T>(resource: string) {
  return {
    fetch: async (setState: (data: T[]) => void) => {
      const { ok, data } = await apiCall<any>(`/api/${resource}`);
      if (ok && data) {
        // Handle both legacy and new API response formats
        const items = (data as any)[resource] || data.data?.[resource] || [];
        setState(items);
      }
    },
    
    add: async (item: Partial<T>, refetch: () => Promise<void>) => {
      const { ok } = await apiCall(`/api/${resource}`, {
        method: 'POST',
        body: JSON.stringify(item),
      });
      if (ok) await refetch();
    },
    
    update: async (id: string, item: Partial<T>, refetch: () => Promise<void>) => {
      const { ok } = await apiCall(`/api/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(item),
      });
      if (ok) await refetch();
    },
    
    delete: async (id: string, refetch: () => Promise<void>) => {
      const { ok } = await apiCall(`/api/${resource}/${id}`, {
        method: 'DELETE',
      });
      if (ok) await refetch();
    },
  };
}

// Clear auth state helper
const clearAuthState = () => ({
  currentUser: null,
  isAuthenticated: false,
  products: [],
  clients: [],
  invoices: [],
  archivedInvoices: [],
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // Create CRUD actions for each resource
      const productActions = createCrudActions<Product>('products');
      const clientActions = createCrudActions<Client>('clients');
      const invoiceActions = createCrudActions<Invoice>('invoices');

      return {
        // Initial state
        currentUser: null,
        isAuthenticated: false,
        loading: false,
        products: [],
        clients: [],
        invoices: [],
        archivedInvoices: [],

        // Auth actions
        register: async (email: string, password: string) => {
          const { ok, data } = await apiCall<any>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });

          if (ok && data) {
            const user = data.user;
            if (user) {
              set({ currentUser: user, isAuthenticated: true });
              return true;
            }
          }
          return false;
        },

        login: async (email: string, password: string) => {
          const { ok, data, error } = await apiCall<any>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });

          console.log('Login response:', { ok, data, error });

          if (ok && data) {
            // The response is { success: true, user: {...} }
            const user = data.user;
            if (user) {
              set({ currentUser: user, isAuthenticated: true });
              // Load user data
              await Promise.all([
                get().fetchProducts(),
                get().fetchClients(),
                get().fetchInvoices(),
              ]);
              return true;
            }
          }
          
          // Log error for debugging
          console.error('Login failed:', error || 'Unknown error', 'Data:', data);
          return false;
        },

        logout: async () => {
          await apiCall('/api/auth/logout', { method: 'POST' });
          set(clearAuthState());
        },

        verifyAuth: async () => {
          if (!get().isAuthenticated) {
            set(clearAuthState());
            return false;
          }

          const { ok } = await apiCall('/api/auth/verify');
          
          if (!ok) {
            set(clearAuthState());
            return false;
          }

          // Load data if missing
          if (!get().currentUser || !get().products.length) {
            await Promise.all([
              get().fetchProducts(),
              get().fetchClients(),
              get().fetchInvoices(),
            ]);
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

          if (ok && data) {
            const updatedUser = data.user;
            if (updatedUser) set({ currentUser: updatedUser });
          }
        },

        completeSetup: async () => {
          const user = get().currentUser;
          if (!user) return;

          const { ok, data } = await apiCall<any>(`/api/user/${user.id}`, {
            method: 'PUT',
            body: JSON.stringify({ isSetupComplete: true }),
          });

          if (ok && data) {
            const updatedUser = data.user;
            if (updatedUser) set({ currentUser: updatedUser });
          }
        },

        // Product actions
        fetchProducts: () => productActions.fetch((products) => set({ products })),
        addProduct: (product) => productActions.add(product, get().fetchProducts),
        updateProduct: (id, product) => productActions.update(id, product, get().fetchProducts),
        deleteProduct: (id) => productActions.delete(id, get().fetchProducts),

        // Client actions
        fetchClients: () => clientActions.fetch((clients) => set({ clients })),
        addClient: (client) => clientActions.add(client, get().fetchClients),
        updateClient: (id, client) => clientActions.update(id, client, get().fetchClients),
        deleteClient: (id) => clientActions.delete(id, get().fetchClients),

        // Invoice actions
        fetchInvoices: () => invoiceActions.fetch((invoices) => set({ invoices })),
        addInvoice: (invoice) => invoiceActions.add(invoice, get().fetchInvoices),
        updateInvoice: (id, invoice) => invoiceActions.update(id, invoice, get().fetchInvoices),
        deleteInvoice: (id) => invoiceActions.delete(id, get().fetchInvoices),

        updateInvoiceStatus: async (id, status) => {
          const { ok } = await apiCall(`/api/invoices/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          });
          if (ok) await get().fetchInvoices();
        },

        fetchArchivedInvoices: async () => {
          const { ok, data } = await apiCall<any>('/api/invoices/archive');
          if (ok && data) {
            const invoices = data.invoices || [];
            set({ archivedInvoices: invoices });
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

        // Helpers
        getNextInvoiceNumber: () => {
          const invoices = get().invoices;
          const year = new Date().getFullYear();
          const count = invoices.filter(
            (inv) => new Date(inv.createdAt).getFullYear() === year
          ).length;
          return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
        },

        getRecentInvoices: () => get().invoices.slice(0, 10),
      };
    },
    {
      name: 'invoice-desk-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
