import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiCall } from '../api-client';
import { useProductsStore } from './useProductStore';
import { useClientsStore } from './useClientStore';
import { useLaborStore } from './useLaborStore';
import { useInvoicesStore } from './useInvoiceStore';
import type { User, BusinessDetails } from '../types';

interface AuthState {
    currentUser: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    verifyAuth: () => Promise<boolean>;
    updateBusinessDetails: (businessDetails: Partial<BusinessDetails>) => Promise<boolean>;
}

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
                // If not authenticated, always return false
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
