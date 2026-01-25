'use client';

import { useEffect, useState } from 'react';
import { useInvoicesStore } from '@/lib/store-mongodb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText, Lock, ChevronRight, Download, Archive } from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
  const [mounted, setMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'json'>('csv');
  
  const invoices = useInvoicesStore(state => state.invoices);
  const archivedInvoices = useInvoicesStore(state => state.archivedInvoices);
  const fetchInvoices = useInvoicesStore(state => state.fetchInvoices);
  const fetchArchivedInvoices = useInvoicesStore(state => state.fetchArchivedInvoices);
  const downloadArchivedInvoices = useInvoicesStore(state => state.downloadArchivedInvoices);
  const downloadArchivedInvoicesJSON = useInvoicesStore(state => state.downloadArchivedInvoicesJSON);
  
  useEffect(() => {
    fetchInvoices();
    fetchArchivedInvoices();
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, [fetchInvoices, fetchArchivedInvoices]);

  const handleDownloadArchive = async (format: 'csv' | 'json') => {
    setIsDownloading(true);
    setDownloadFormat(format);
    if (format === 'csv') {
      await downloadArchivedInvoices();
    } else {
      await downloadArchivedInvoicesJSON();
    }
    setIsDownloading(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 min-w-[70px]">
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 min-w-[70px]">
        Pending
      </span>
    );
  };

  if (!mounted) {
    return (
      <div>
        <PageHeader
          title="Invoices"
          description="Create and manage your invoices"
          action={
            <LinkButton href="/invoices/new">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </LinkButton>
          }
        />
        <Card className="animate-pulse">
          <div className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Current month invoices with full access"
        action={
          <LinkButton href="/invoices/new">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </LinkButton>
        }
      />

      {invoices.length === 0 && archivedInvoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create your first invoice to get started with billing."
            action={
              <LinkButton href="/invoices/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Current Month Invoices - Full Access */}
          {invoices.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-foreground">
                  Current Month ({invoices.length})
                </h2>
                <span className="text-xs text-muted-foreground bg-green-100 text-green-700 px-2 py-1 rounded">
                  Full Access
                </span>
              </div>
              <Card>
                <div className="divide-y">
                  {invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-muted/50 transition-colors cursor-pointer group gap-3"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="hidden sm:flex w-10 h-10 rounded-lg bg-primary/10 items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base truncate">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{invoice.clientName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-medium text-foreground text-sm sm:text-base">{formatCurrency(invoice.total)}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(invoice.createdAt)}</p>
                        </div>
                        {getStatusBadge(invoice.status)}
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Last Month Archived - Basic Details Only */}
          {archivedInvoices.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Last Month Archive ({archivedInvoices.length})
                  </h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadArchive('csv')}
                    disabled={isDownloading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading && downloadFormat === 'csv' ? 'Downloading...' : 'CSV'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadArchive('json')}
                    disabled={isDownloading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading && downloadFormat === 'json' ? 'Downloading...' : 'JSON'}
                  </Button>
                </div>
              </div>
              <Card className="bg-muted/30 border-dashed">
                <div className="divide-y divide-border/50">
                  {archivedInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 opacity-60 gap-3"
                      title="Archived - Basic details only. Download CSV for full data."
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="hidden sm:flex w-10 h-10 rounded-lg bg-muted items-center justify-center flex-shrink-0">
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-muted-foreground text-sm sm:text-base truncate">{invoice.invoiceNumber}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground/70 truncate">{invoice.clientName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-medium text-muted-foreground text-sm sm:text-base">{formatCurrency(invoice.total || 0)}</p>
                          <p className="text-xs text-muted-foreground/70 hidden sm:block">
                            {invoice.createdAt ? formatDate(invoice.createdAt) : 'N/A'}
                          </p>
                        </div>
                        {invoice.status && getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 sm:px-6 py-3 bg-muted/50 border-t border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Archived invoices show basic details only. Download CSV or JSON for complete data including all items, taxes, and client information.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
