import { create } from 'zustand';
import { apiCall } from '../api-client';
import type { Product } from '../types';

interface ProductsState {
    products: Product[];
    fetchProducts: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
    updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
    deleteProduct: (id: string) => Promise<boolean>;
}

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
