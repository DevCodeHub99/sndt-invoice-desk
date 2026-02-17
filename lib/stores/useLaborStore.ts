import { create } from 'zustand';
import { apiCall } from '../api-client';
import type { Labor } from '../types';

interface LaborState {
    laborCharges: Labor[];
    fetchLaborCharges: () => Promise<void>;
    addLaborCharge: (labor: Omit<Labor, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
    updateLaborCharge: (id: string, labor: Partial<Labor>) => Promise<boolean>;
    deleteLaborCharge: (id: string) => Promise<boolean>;
}

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
