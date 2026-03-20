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
import { formatCurrency } from '@/lib/utils';
import { Plus, Package, Pencil, Trash2 } from 'lucide-react';
import { apiCall } from '@/lib/api-client';
import type { Product } from '@/lib/types';

interface ProductListClientProps {
    initialProducts: Product[];
}

export default function ProductListClient({ initialProducts }: ProductListClientProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        hsnSac: '',
    });

    const products = initialProducts;

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', hsnSac: '' });
        setEditingProduct(null);
    };

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price.toString(),
                hsnSac: product.hsnSac || '',
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
            setError('Product name is required');
            return;
        }
        
        const price = parseFloat(formData.price);
        if (isNaN(price) || price < 0) {
            setError('Please enter a valid price');
            return;
        }

        setIsSubmitting(true);
        const productData = {
            name: formData.name.trim(),
            description: formData.description.trim() || '',
            price: price,
            hsnSac: formData.hsnSac.trim() || undefined,
        };

        try {
            let response;
            if (editingProduct) {
                response = await apiCall(`/api/products/${editingProduct.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(productData),
                });
            } else {
                response = await apiCall('/api/products', {
                    method: 'POST',
                    body: JSON.stringify(productData),
                });
            }

            if (response.ok) {
                closeModal();
                router.refresh();
            } else {
                // Show error from API
                setError(response.error || 'Failed to save product');
            }
        } catch (error) {
            console.error('Failed to save product:', error);
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
                const { ok } = await apiCall(`/api/products/${deleteId}`, { method: 'DELETE' });
                if (ok) {
                    setDeleteId(null);
                    router.refresh();
                }
            } catch (error) {
                console.error('Failed to delete product:', error);
            }
        }
    };

    return (
        <div>
            <PageHeader
                title="Products"
                description="Manage your products and services"
                action={products.length === 0 ? (
                    <Button onClick={() => openModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Button>
                ) : undefined}
            />

            {products.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Package}
                        title="No products yet"
                        description="Add your first product to start creating invoices."
                        action={
                            <Button onClick={() => openModal()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Product
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
                        <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors">Add Product</p>
                    </button>

                    {/* Product Cards */}
                    {products.map((product) => (
                        <Card
                            key={product.id}
                            className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
                            onClick={() => openModal(product)}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Package className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="text-lg font-semibold text-foreground">
                                                {formatCurrency(product.price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {product.description && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                                )}

                                {product.hsnSac && (
                                    <p className="text-xs text-muted-foreground mb-2">HSN/SAC: <span className="font-semibold text-foreground">{product.hsnSac}</span></p>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openModal(product);
                                            }}
                                            className="p-2 rounded-lg hover:bg-secondary/10 transition-colors"
                                            aria-label="Edit product"
                                        >
                                            <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, product.id)}
                                            className="p-2 rounded-lg hover:bg-danger/10 transition-colors"
                                            aria-label="Delete product"
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
                title={editingProduct ? 'Edit Product' : 'Add Product'}
            >
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}
                    <Input
                        label="Product Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Consulting Service"
                        required
                        autoFocus
                    />
                    <Input
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description (optional)"
                    />
                    <Input
                        label="Price (₹)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        required
                    />
                    <Input
                        label="HSN/SAC Code (Optional)"
                        value={formData.hsnSac}
                        onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                        placeholder="e.g., 9406 or 998311"
                    />
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {editingProduct ? 'Save Changes' : (isSubmitting ? 'Adding...' : 'Add Product')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Product"
                message="Are you sure you want to remove this product? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
}
