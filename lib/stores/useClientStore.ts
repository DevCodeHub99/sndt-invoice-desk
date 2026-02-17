import { create } from 'zustand';
import { apiCall } from '../api-client';
import type { Client } from '../types';

interface ClientsState {
    clients: Client[];
    fetchClients: () => Promise<void>;
    addClient: (client: Omit<Client, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
    updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
    deleteClient: (id: string) => Promise<boolean>;
}

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
