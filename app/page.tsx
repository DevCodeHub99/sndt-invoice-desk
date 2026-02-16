'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useInvoicesStore, useClientsStore } from '@/lib/store-mongodb';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/LinkButton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, TrendingUp, Clock, Building2, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();

  // ✅ GOOD: Only subscribe to what you need
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // ✅ Load data on demand
  const invoices = useInvoicesStore(state => state.invoices);
  const fetchInvoices = useInvoicesStore(state => state.fetchInvoices);

  const clients = useClientsStore(state => state.clients);
  const fetchClients = useClientsStore(state => state.fetchClients);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Load data on mount
    fetchInvoices();
    fetchClients();
  }, [isAuthenticated, fetchInvoices, fetchClients, router]);

  // ✅ GOOD: Memoize expensive calculations
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = invoices.filter((inv) => {
      const invDate = new Date(inv.createdAt);
      return invDate.getMonth() === now.getMonth() &&
        invDate.getFullYear() === now.getFullYear();
    });

    const totalRevenueThisMonth = thisMonth.reduce((sum, inv) => sum + inv.total, 0);
    const pendingInvoices = invoices.filter((inv) => inv.status !== 'paid').length;

    return [
      {
        label: 'Invoices This Month',
        value: thisMonth.length,
        icon: FileText,
        color: 'text-primary',
        bg: 'bg-primary/10',
        href: '/invoices',
      },
      {
        label: 'Revenue This Month',
        value: formatCurrency(totalRevenueThisMonth),
        icon: TrendingUp,
        color: 'text-success',
        bg: 'bg-success/10',
        href: '/invoices',
      },
      {
        label: 'Pending Invoices',
        value: pendingInvoices,
        icon: Clock,
        color: 'text-warning',
        bg: 'bg-warning/10',
        href: '/invoices',
      },
      {
        label: 'Total Clients',
        value: clients.length,
        icon: Building2,
        color: 'text-secondary-foreground',
        bg: 'bg-secondary',
        href: '/clients',
      },
    ];
  }, [invoices, clients]);

  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your billing activity"
        action={
          <LinkButton href="/invoices/new" aria-label="Create new invoice">
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            New Invoice
          </LinkButton>
        }
      />

      {/* Stats Cards */}
      <section aria-label="Business statistics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="block"
              aria-label={`${stat.label}: ${stat.value}`}
            >
              <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-semibold text-foreground truncate">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions - Note: Products count removed to avoid loading products store */}
      <nav aria-label="Quick actions" className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/invoices/new"
          className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:shadow-md hover:border-primary/30 transition-all"
          aria-label="Create new invoice"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Create Invoice</p>
            <p className="text-sm text-muted-foreground">Bill a client</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </Link>

        <Link
          href="/products"
          className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:shadow-md hover:border-primary/30 transition-all"
          aria-label="View products"
        >
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center" aria-hidden="true">
            <FileText className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Products</p>
            <p className="text-sm text-muted-foreground">Manage catalog</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </Link>

        <Link
          href="/clients"
          className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:shadow-md hover:border-primary/30 transition-all"
          aria-label={`View clients (${clients.length} companies)`}
        >
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center" aria-hidden="true">
            <Building2 className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Clients</p>
            <p className="text-sm text-muted-foreground">{clients.length} companies</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      </nav>

      {/* Recent Invoices */}
      <section aria-labelledby="recent-invoices-heading">
        <Card>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between">
            <h2 id="recent-invoices-heading" className="font-semibold text-foreground text-sm sm:text-base">Recent Invoices</h2>
            <Link
              href="/invoices"
              className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
              aria-label="View all invoices"
            >
              View all
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          <div>
            {recentInvoices.length === 0 ? (
              <div className="py-8 sm:py-12 text-center px-4">
                <p className="text-muted-foreground mb-4 text-sm">No invoices yet</p>
                <LinkButton href="/invoices/new" aria-label="Create your first invoice">
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create First Invoice
                </LinkButton>
              </div>
            ) : (
              <ul className="divide-y" role="list">
                {recentInvoices.map((invoice, index) => {
                  const isRecent = index < 10;
                  return (
                    <li key={invoice.id}>
                      <Link
                        href={isRecent ? `/invoices/${invoice.id}` : '/invoices'}
                        className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-muted/50 transition-colors cursor-pointer gap-3"
                        aria-label={`Invoice ${invoice.invoiceNumber} for ${invoice.clientName}, ${formatCurrency(invoice.total)}, status: ${invoice.status}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-muted items-center justify-center flex-shrink-0" aria-hidden="true">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm sm:text-base truncate">{invoice.invoiceNumber}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{invoice.clientName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-medium text-foreground text-sm sm:text-base">{formatCurrency(invoice.total)}</p>
                            <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(invoice.createdAt)}</p>
                          </div>
                          <Badge variant={
                            invoice.status === 'paid' ? 'success' :
                              invoice.status === 'partial' ? 'info' : 'warning'
                          }>
                            {invoice.status === 'paid' ? 'Paid' :
                              invoice.status === 'partial' ? 'Partial' : 'Pending'}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" aria-hidden="true" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
