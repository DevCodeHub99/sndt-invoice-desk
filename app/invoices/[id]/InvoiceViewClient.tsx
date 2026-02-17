'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { InvoiceTemplate } from '@/components/invoice/InvoiceTemplate';
import type { Invoice, User } from '@/lib/types';
import { ArrowLeft, Pencil, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { apiCall } from '@/lib/api-client';

type Serialized<T> = {
    [P in keyof T]: T[P] extends Date ? string : T[P] extends object ? Serialized<T[P]> : T[P];
};

interface InvoiceViewClientProps {
    invoice: Serialized<Invoice>;
    currentUser?: Serialized<User>;
}

export default function InvoiceViewClient({ invoice: initialInvoice, currentUser }: InvoiceViewClientProps) {
    const router = useRouter();
    const [invoice, setInvoice] = useState(initialInvoice);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setInvoice(initialInvoice);
    }, [initialInvoice]);

    const handleStatusToggle = async () => {
        if (isUpdating) return;

        // Cycle through statuses: pending -> partial -> paid -> pending
        let newStatus: Invoice['status'];
        if (invoice.status === 'pending') {
            newStatus = 'partial';
        } else if (invoice.status === 'partial') {
            newStatus = 'paid';
        } else {
            newStatus = 'pending';
        }

        setIsUpdating(true);
        try {
            // Optimistic update
            setInvoice({ ...invoice, status: newStatus });

            const { ok } = await apiCall(`/api/invoices/${invoice.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });

            if (ok) {
                router.refresh();
            } else {
                // Revert on failure
                setInvoice(initialInvoice);
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            setInvoice(initialInvoice);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusConfig = (status: string) => {
        if (status === 'paid') {
            return {
                label: 'Paid',
                color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
                icon: '✓'
            };
        }
        if (status === 'partial') {
            return {
                label: 'Partial',
                color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
                icon: '◐'
            };
        }
        return {
            label: 'Pending',
            color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
            icon: '⏱'
        };
    };

    const statusData = getStatusConfig(invoice.status);

    // Set document title for print/save
    useEffect(() => {
        const originalTitle = document.title;
        document.title = invoice.invoiceNumber;
        return () => {
            document.title = originalTitle;
        };
    }, [invoice.invoiceNumber]);

    // Handle keyboard shortcut for printing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div>
            <div className="mb-6 no-print">
                <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 block">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Invoices
                </Link>

                {/* Header Actions - hidden on print */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Invoice {invoice.invoiceNumber}</h1>
                        <p className="text-muted-foreground">Professional GST-Compliant Invoice</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/invoices/${invoice.id}/edit`}
                            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 h-10 px-4 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        >
                            <Pencil className="w-4 h-4" />
                            <span className="ml-2">Edit</span>
                        </Link>

                        <button
                            onClick={handleStatusToggle}
                            disabled={isUpdating}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-all ${statusData.color} ${(isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Click to change status"
                        >
                            <span>{statusData.icon}</span>
                            <span>{statusData.label}</span>
                        </button>

                        <Button variant="secondary" onClick={() => window.print()}>
                            <Printer className="w-4 h-4" />
                            <span className="ml-2">Print</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="max-w-4xl mx-auto" id="invoice-print-container">
                    <InvoiceTemplate
                        invoice={invoice as any} // Cast because Serialized<Invoice> vs Invoice (Date vs string)
                        currentUser={currentUser as any}
                        className="invoice-card shadow-lg"
                    />
                </div>
            </div>
        </div>
    );
}
