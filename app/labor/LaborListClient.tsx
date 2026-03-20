'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { Plus, Wrench, Pencil, Trash2 } from 'lucide-react';
import { apiCall } from '@/lib/api-client';
import type { Labor } from '@/lib/types';

interface LaborListClientProps {
    initialLaborCharges: Labor[];
}

export default function LaborListClient({ initialLaborCharges }: LaborListClientProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [editingLabor, setEditingLabor] = useState<Labor | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        rateType: 'fixed' as 'fixed' | 'per_unit',
        rate: '',
        unit: '',
    });

    const laborCharges = initialLaborCharges;

    const resetForm = () => {
        setFormData({ name: '', description: '', rateType: 'fixed', rate: '', unit: '' });
        setEditingLabor(null);
    };

    const openModal = (labor?: Labor) => {
        if (labor) {
            setEditingLabor(labor);
            setFormData({
                name: labor.name,
                description: labor.description,
                rateType: labor.rateType,
                rate: labor.rate.toString(),
                unit: labor.unit || '',
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setError('');
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Client-side validation
        setError('');
        
        if (!formData.name.trim()) {
            setError('Labor name is required');
            return;
        }
        
        const rate = parseFloat(formData.rate);
        if (isNaN(rate) || rate < 0) {
            setError('Please enter a valid rate');
            return;
        }

        setIsSubmitting(true);
        const laborData = {
            name: formData.name.trim(),
            description: formData.description.trim() || '',
            rateType: formData.rateType,
            rate: rate,
            unit: formData.rateType === 'per_unit' ? formData.unit.trim() || undefined : undefined,
        };

        try {
            let response;
            if (editingLabor) {
                response = await apiCall(`/api/labor/${editingLabor.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(laborData),
                });
            } else {
                response = await apiCall('/api/labor', {
                    method: 'POST',
                    body: JSON.stringify(laborData),
                });
            }

            if (response.ok) {
                closeModal();
                router.refresh();
            } else {
                // Show error from API
                setError(response.data?.error || 'Failed to save labor charge');
            }
        } catch (error) {
            console.error('Failed to save labor charge:', error);
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            try {
                const { ok } = await apiCall(`/api/labor/${deleteId}`, { method: 'DELETE' });
                if (ok) {
                    setDeleteId(null);
                    router.refresh();
                }
            } catch (error) {
                console.error('Failed to delete labor charge:', error);
            }
        }
    };

    return (
        <div>
            <PageHeader
                title="Labor & Manpower"
                description="Manage labor charges and manpower costs"
                action={laborCharges.length === 0 ? (
                    <Button onClick={() => openModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Labor Charge
                    </Button>
                ) : undefined}
            />

            {laborCharges.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Wrench}
                        title="No labor charges yet"
                        description="Add labor charges like loading, unloading, installation, etc."
                        action={
                            <Button onClick={() => openModal()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Labor Charge
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Add New Card */}
                    <button
                        onClick={() => openModal()}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-all min-h-[120px] sm:min-h-[160px] cursor-pointer group"
                    >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors">Add Labor Charge</p>
                    </button>

                    {/* Labor Cards */}
                    {laborCharges.map((labor) => (
                        <Card
                            key={labor.id}
                            className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
                            onClick={() => openModal(labor)}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                                            <Wrench className="w-5 h-5 text-warning" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                {labor.name}
                                            </h3>
                                            <p className="text-lg font-semibold text-foreground">
                                                {labor.rateType === 'fixed'
                                                    ? formatCurrency(labor.rate)
                                                    : `${formatCurrency(labor.rate)}${labor.unit ? ` ${labor.unit}` : '/qty'}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {labor.description && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{labor.description}</p>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t">
                                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                        {labor.rateType === 'fixed' ? 'Fixed Price' : 'Per Qty'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openModal(labor);
                                            }}
                                            className="p-2 rounded-lg hover:bg-secondary/10 transition-colors"
                                            aria-label="Edit labor charge"
                                        >
                                            <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, labor.id)}
                                            className="p-2 rounded-lg hover:bg-danger/10 transition-colors"
                                            aria-label="Delete labor charge"
                                        >
                                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-danger" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingLabor ? 'Edit Labor Charge' : 'Add Labor Charge'}
            >
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}
                    <Input
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Loading/Unloading"
                        required
                        autoFocus
                    />
                    <Input
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description (optional)"
                    />
                    <Select
                        label="Rate Type"
                        options={[
                            { value: 'fixed', label: 'Fixed Price' },
                            { value: 'per_unit', label: 'Per Qty' },
                        ]}
                        value={formData.rateType}
                        onChange={(e) => setFormData({ ...formData, rateType: e.target.value as 'fixed' | 'per_unit' })}
                    />
                    <Input
                        label={formData.rateType === 'fixed' ? 'Amount (₹)' : 'Rate per Qty (₹)'}
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                        placeholder="0.00"
                        required
                    />
                    {formData.rateType === 'per_unit' && (
                        <Input
                            label="Unit Description (Optional)"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            placeholder="e.g., per brick, per bag, per hour"
                        />
                    )}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {editingLabor ? 'Save Changes' : (isSubmitting ? 'Adding...' : 'Add Labor Charge')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Labor Charge"
                message="Are you sure you want to remove this labor charge? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
}
