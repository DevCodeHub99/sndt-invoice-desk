'use client';

import { useAuthStore, useInvoicesStore } from '@/lib/store-mongodb';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { InvoiceTemplate } from '@/components/invoice/InvoiceTemplate';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import type { Invoice } from '@/lib/types';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function InvoiceViewPage() {
  const params = useParams();
  const invoices = useInvoicesStore(state => state.invoices);
  const currentUser = useAuthStore(state => state.currentUser);
  const updateInvoiceStatus = useInvoicesStore(state => state.updateInvoiceStatus);
  const invoiceId = params.id as string;
  const invoice = invoices.find((inv) => inv.id === invoiceId);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Invoice Not Found" description="The invoice you're looking for doesn't exist." />
        <Card>
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Invoice not found</p>
            <Link href="/invoices">
              <Button>Back to Invoices</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    try {
      const pdfBlob = await generateInvoicePDF(invoice, currentUser || undefined);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStatusToggle = () => {
    // Cycle through statuses: pending -> partial -> paid -> pending
    let newStatus: Invoice['status'];
    if (invoice.status === 'pending') {
      newStatus = 'partial';
    } else if (invoice.status === 'partial') {
      newStatus = 'paid';
    } else {
      newStatus = 'pending';
    }
    updateInvoiceStatus(invoice.id, newStatus);
  };

  const getStatusConfig = (status: Invoice['status']) => {
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

  const statusConfig = getStatusConfig(invoice.status);

  return (
    <div>
      <div className="mb-6 no-print">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>

        <PageHeader
          title={`Invoice ${invoice.invoiceNumber}`}
          description="Professional GST-Compliant Invoice"
          action={
            <div className="flex items-center gap-3">
              <button
                onClick={handleStatusToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-all ${statusConfig.color}`}
                title="Click to change status"
              >
                <span>{statusConfig.icon}</span>
                <span>{statusConfig.label}</span>
              </button>

              <Button variant="secondary" onClick={handleDownloadPDF} disabled={isDownloading}>
                <Download className="w-4 h-4" />
                <span className="ml-2">{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
              </Button>
            </div>
          }
        />
      </div>

      <div className="space-y-6">
        <div className="max-w-4xl mx-auto">
          <InvoiceTemplate
            invoice={invoice}
            currentUser={currentUser || undefined}
            className="invoice-card shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
