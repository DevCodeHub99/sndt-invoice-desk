'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Building2, Pencil, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { apiCall } from '@/lib/api-client';
import type { Client } from '@/lib/types';

interface ClientListClientProps {
    initialClients: Client[];
}

const emptyForm = {
    companyName: '',
    taxId: '',
    email: '',
    phone: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    shippingSameAsBilling: true,
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
};

export default function ClientListClient({ initialClients }: ClientListClientProps) {
    const router = useRouter();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const clients = initialClients;

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingClient(null);
    };

    const openDetails = (client: Client) => {
        setSelectedClient(client);
        setIsDetailsOpen(true);
    };

    const closeDetails = () => {
        setIsDetailsOpen(false);
        setSelectedClient(null);
    };

    const openEdit = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                companyName: client.companyName,
                taxId: client.taxId || '',
                email: client.email,
                phone: client.phone,
                billingAddress: client.billingAddress,
                billingCity: client.billingCity,
                billingState: client.billingState,
                billingZipCode: client.billingZipCode,
                billingCountry: client.billingCountry,
                shippingSameAsBilling: client.shippingSameAsBilling,
                shippingAddress: client.shippingAddress,
                shippingCity: client.shippingCity,
                shippingState: client.shippingState,
                shippingZipCode: client.shippingZipCode,
                shippingCountry: client.shippingCountry,
            });
        } else {
            resetForm();
        }
        setIsEditOpen(true);
    };

    const closeEdit = () => {
        setIsEditOpen(false);
        setError('');
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Client-side validation
        setError('');
        
        if (!formData.companyName.trim()) {
            setError('Company name is required');
            return;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }
        if (!formData.phone.trim()) {
            setError('Phone is required');
            return;
        }
        if (!formData.billingAddress.trim()) {
            setError('Billing address is required');
            return;
        }
        if (!formData.billingCity.trim()) {
            setError('Billing city is required');
            return;
        }
        if (!formData.billingState.trim()) {
            setError('Billing state is required');
            return;
        }
        if (!formData.billingZipCode.trim()) {
            setError('Billing PIN code is required');
            return;
        }
        if (!formData.billingCountry.trim()) {
            setError('Billing country is required');
            return;
        }

        // Validate shipping address if different from billing
        if (!formData.shippingSameAsBilling) {
            if (!formData.shippingAddress.trim()) {
                setError('Shipping address is required');
                return;
            }
            if (!formData.shippingCity.trim()) {
                setError('Shipping city is required');
                return;
            }
            if (!formData.shippingState.trim()) {
                setError('Shipping state is required');
                return;
            }
            if (!formData.shippingZipCode.trim()) {
                setError('Shipping PIN code is required');
                return;
            }
            if (!formData.shippingCountry.trim()) {
                setError('Shipping country is required');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            let response;
            if (editingClient) {
                response = await apiCall(`/api/clients/${editingClient.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData),
                });
            } else {
                response = await apiCall('/api/clients', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
            }

            if (response.ok) {
                closeEdit();
                router.refresh();
            } else {
                // Show error from API
                setError(response.data?.error || 'Failed to save client');
            }
        } catch (error) {
            console.error('Failed to save client:', error);
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
                const { ok } = await apiCall(`/api/clients/${deleteId}`, { method: 'DELETE' });
                if (ok) {
                    setDeleteId(null);
                    closeDetails();
                    router.refresh();
                }
            } catch (error) {
                console.error('Failed to delete client:', error);
            }
        }
    };

    const getFullAddress = (client: Client) => {
        const parts = [client.billingAddress, client.billingCity, client.billingState, client.billingZipCode, client.billingCountry].filter(Boolean);
        return parts.join(', ');
    };

    const getShippingAddress = (client: Client) => {
        if (client.shippingSameAsBilling) {
            return getFullAddress(client);
        }
        const parts = [client.shippingAddress, client.shippingCity, client.shippingState, client.shippingZipCode, client.shippingCountry].filter(Boolean);
        return parts.join(', ');
    };

    return (
        <div>
            <PageHeader
                title="Clients"
                description="Manage your client companies"
                action={clients.length === 0 ? (
                    <Button onClick={() => openEdit()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Client
                    </Button>
                ) : undefined}
            />

            {clients.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Building2}
                        title="No clients yet"
                        description="Add your first client to start creating invoices."
                        action={
                            <Button onClick={() => openEdit()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Client
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Add New Card */}
                    <button
                        onClick={() => openEdit()}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-all min-h-[140px] sm:min-h-[180px] cursor-pointer group"
                    >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors">Add Client</p>
                    </button>

                    {/* Client Cards */}
                    {clients.map((client) => (
                        <Card
                            key={client.id}
                            className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
                            onClick={() => openDetails(client)}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Building2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                {client.companyName}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEdit(client);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-secondary/10 transition-colors"
                                            aria-label="Edit client"
                                        >
                                            <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, client.id)}
                                            className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                                            aria-label="Delete client"
                                        >
                                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-danger" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-4 h-4 flex-shrink-0" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                    {getFullAddress(client) && (
                                        <div className="flex items-start gap-2 text-muted-foreground">
                                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{getFullAddress(client)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={closeDetails}
                title={selectedClient?.companyName || 'Client Details'}
                size="lg"
            >
                {selectedClient && (
                    <div className="p-4 sm:p-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold mb-4 text-foreground">Company Information</h3>
                            <div className="space-y-3">
                                {selectedClient.taxId && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Tax ID</p>
                                        <p className="text-sm font-medium text-foreground">{selectedClient.taxId}</p>
                                    </div>
                                )}
                                {selectedClient.email && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium text-foreground">{selectedClient.email}</p>
                                    </div>
                                )}
                                {selectedClient.phone && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium text-foreground">{selectedClient.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-4 text-foreground">Billing Address</h3>
                            <p className="text-sm text-foreground">{getFullAddress(selectedClient)}</p>
                        </div>

                        {!selectedClient.shippingSameAsBilling && (
                            <div>
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Shipping Address</h3>
                                <p className="text-sm text-foreground">{getShippingAddress(selectedClient)}</p>
                            </div>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="secondary" onClick={closeDetails} disabled={isSubmitting}>
                                Close
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    closeDetails();
                                    openEdit(selectedClient);
                                }}
                                disabled={isSubmitting}
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                            <button
                                onClick={() => setDeleteId(selectedClient.id)}
                                className="px-4 py-2 rounded-lg text-danger hover:bg-danger/10 transition-colors text-sm font-medium"
                                disabled={isSubmitting}
                            >
                                <Trash2 className="w-4 h-4 inline mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={closeEdit}
                title={editingClient ? 'Edit Client' : 'Add Client'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Company Name"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="Acme Corporation"
                            required
                            autoFocus
                        />
                        <Input
                            label="Tax ID (GSTIN/PAN)"
                            value={formData.taxId}
                            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                            placeholder="27AABCT1234H1Z0 or AAAPA1234A"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="billing@company.com"
                        />
                        <Input
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Billing Address Section */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4 text-foreground">Billing Address</h3>
                        <Input
                            label="Address"
                            value={formData.billingAddress}
                            onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                            placeholder="123 Business Street"
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
                            <Input
                                label="City"
                                value={formData.billingCity}
                                onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                                placeholder="Mumbai"
                            />
                            <Input
                                label="State"
                                value={formData.billingState}
                                onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                                placeholder="MH"
                            />
                            <Input
                                label="PIN Code"
                                value={formData.billingZipCode}
                                onChange={(e) => setFormData({ ...formData, billingZipCode: e.target.value })}
                                placeholder="400001"
                            />
                            <Input
                                label="Country"
                                value={formData.billingCountry}
                                onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                                placeholder="India"
                            />
                        </div>
                    </div>

                    {/* Shipping Address Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="checkbox"
                                id="sameAsShipping"
                                checked={formData.shippingSameAsBilling}
                                onChange={(e) => setFormData({ ...formData, shippingSameAsBilling: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                            />
                            <label htmlFor="sameAsShipping" className="text-sm font-semibold text-foreground cursor-pointer">
                                Shipping address same as billing
                            </label>
                        </div>

                        {!formData.shippingSameAsBilling && (
                            <>
                                <h3 className="text-sm font-semibold mb-4 text-foreground">Shipping Address</h3>
                                <Input
                                    label="Address"
                                    value={formData.shippingAddress}
                                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                                    placeholder="123 Business Street"
                                />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
                                    <Input
                                        label="City"
                                        value={formData.shippingCity}
                                        onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                                        placeholder="Mumbai"
                                    />
                                    <Input
                                        label="State"
                                        value={formData.shippingState}
                                        onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                                        placeholder="MH"
                                    />
                                    <Input
                                        label="PIN Code"
                                        value={formData.shippingZipCode}
                                        onChange={(e) => setFormData({ ...formData, shippingZipCode: e.target.value })}
                                        placeholder="400001"
                                    />
                                    <Input
                                        label="Country"
                                        value={formData.shippingCountry}
                                        onChange={(e) => setFormData({ ...formData, shippingCountry: e.target.value })}
                                        placeholder="India"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeEdit} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {editingClient ? 'Save Changes' : (isSubmitting ? 'Adding...' : 'Add Client')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Client"
                message="Are you sure you want to remove this client? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
}
