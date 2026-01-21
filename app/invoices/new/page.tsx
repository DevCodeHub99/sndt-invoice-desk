'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useProductsStore, useClientsStore, useInvoicesStore } from '@/lib/store-mongodb';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatCurrency, calculateItemTotal, getStateFromGSTIN } from '@/lib/utils';
import { Plus, Trash2, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import type { InvoiceItem } from '@/lib/types';

interface LineItem {
  id: string;
  productId: string;
  quantity: number;
  taxRate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const clients = useClientsStore((state) => state.clients);
  const fetchClients = useClientsStore((state) => state.fetchClients);
  const products = useProductsStore((state) => state.products);
  const fetchProducts = useProductsStore((state) => state.fetchProducts);
  const addInvoice = useInvoicesStore((state) => state.addInvoice);
  const [clientId, setClientId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ id: uuidv4(), productId: '', quantity: 1, taxRate: currentUser?.businessDetails?.defaultTaxRate || 18 }]);
  const [notes, setNotes] = useState('');
  const [dueInDays, setDueInDays] = useState('30');

  // Fetch clients and products on mount
  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, [fetchClients, fetchProducts]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const invoiceItems: InvoiceItem[] = useMemo(() => {
    return lineItems
      .filter((item) => item.productId)
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const itemSubtotal = item.quantity * product.price;
        const itemTax = itemSubtotal * (item.taxRate / 100);
        return {
          id: item.id,
          productId: product.id,
          productName: product.name,
          description: product.description,
          hsnSac: product.hsnSac, // Include HSN/SAC from product
          quantity: item.quantity,
          unitPrice: product.price,
          taxRate: item.taxRate,
          total: itemSubtotal + itemTax,
        };
      })
      .filter(Boolean) as InvoiceItem[];
  }, [lineItems, products]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    // Get states from GSTIN (first 2 digits)
    const businessState = getStateFromGSTIN(currentUser?.businessDetails?.taxId);
    const clientState = getStateFromGSTIN(selectedClient?.taxId);

    // Check if inter-state transaction
    const isInterState = businessState && clientState && businessState !== clientState;

    invoiceItems.forEach((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;
      
      if (isInterState) {
        // Inter-state: Apply IGST
        const itemIgst = itemSubtotal * (item.taxRate / 100);
        totalIgst += itemIgst;
      } else {
        // Intra-state: Apply CGST + SGST (split equally)
        const itemCgst = itemSubtotal * (item.taxRate / 200);
        const itemSgst = itemSubtotal * (item.taxRate / 200);
        totalCgst += itemCgst;
        totalSgst += itemSgst;
      }
    });

    const totalTax = totalCgst + totalSgst + totalIgst;
    const total = subtotal + totalTax;
    const roundOff = Math.round(total) - total;

    return { 
      subtotal, 
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      roundOff,
      total: Math.round(total),
      isInterState: isInterState || false,
      businessState,
      clientState
    };
  }, [invoiceItems, selectedClient, currentUser?.businessDetails?.taxId]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: uuidv4(), productId: '', quantity: 1, taxRate: currentUser?.businessDetails?.defaultTaxRate || 18 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || invoiceItems.length === 0) return;

    const client = clients.find((c) => c.id === clientId)!;
    const clientAddress = [client.billingAddress, client.billingCity, client.billingState, client.billingZipCode, client.billingCountry]
      .filter(Boolean)
      .join(', ');

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(dueInDays));

    addInvoice({
      clientId: client.id,
      clientName: client.companyName,
      clientAddress,
      clientGstin: client.taxId,
      clientState: client.billingState,
      placeOfSupply: `${client.billingState} - ${getStateFromGSTIN(client.taxId)}`,
      isInterState: totals.isInterState,
      items: invoiceItems,
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      roundOff: totals.roundOff,
      total: totals.total,
      status: 'pending',
      notes,
      dueDate,
    });

    router.push('/invoices');
  };

  const clientOptions = [
    { value: '', label: 'Select a client...' },
    ...clients.map((c) => ({ value: c.id, label: c.companyName })),
  ];

  const productOptions = [
    { value: '', label: 'Select a product...' },
    ...products.map((p) => ({ value: p.id, label: `${p.name} - ${formatCurrency(p.price)}` })),
  ];

  const canSubmit = clientId && invoiceItems.length > 0;

  return (
    <div>
      <div className="mb-6">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>
        <PageHeader title="Create Invoice" description="Fill in the details to generate a new invoice" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            {/* Client Selection */}
            <Card>
              <CardContent>
                <h3 className="font-medium text-foreground mb-4">Client Information</h3>
                <SearchableSelect
                  label="Select Client"
                  options={clientOptions}
                  value={clientId}
                  onChange={setClientId}
                  placeholder="Select a client..."
                  threshold={10}
                />
                {selectedClient && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground">{selectedClient.companyName}</p>
                    {selectedClient.email && (
                      <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                    )}
                  </div>
                )}
                {clients.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No clients yet.{' '}
                    <Link href="/clients" className="text-primary hover:underline">
                      Add a client first
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardContent>
                <h3 className="font-medium text-foreground mb-4 text-sm sm:text-base">Invoice Items</h3>
                <div className="space-y-3">
                  {lineItems.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId);
                    const itemSubtotal = product ? item.quantity * product.price : 0;
                    const itemTax = itemSubtotal * (item.taxRate / 100);
                    const itemTotal = itemSubtotal + itemTax;

                    return (
                      <div key={item.id} className="flex flex-col gap-2 p-3 sm:p-4 bg-muted/30 rounded-lg sm:rounded-lg border">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
                          <div className="flex-1">
                            <SearchableSelect
                              label={index === 0 ? 'Product' : undefined}
                              options={productOptions}
                              value={item.productId}
                              onChange={(value) => updateLineItem(item.id, 'productId', value)}
                              placeholder="Select a product..."
                              threshold={10}
                            />
                          </div>
                          <div className="w-20 sm:w-24">
                            <Input
                              label="Qty"
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            className="h-10 px-3 rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-30"
                            disabled={lineItems.length === 1}
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4 text-danger" />
                          </button>
                        </div>
                        {product && (
                          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground pt-2 border-t">
                            <span>Subtotal: {formatCurrency(itemSubtotal)}</span>
                            <span>Tax ({item.taxRate}%): {formatCurrency(itemTax)}</span>
                            <span className="font-medium text-foreground">Total: {formatCurrency(itemTotal)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button type="button" variant="secondary" onClick={addLineItem} className="mt-4 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No products yet.{' '}
                    <Link href="/products" className="text-primary hover:underline">
                      Add products first
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent>
                <h3 className="font-medium text-foreground mb-4">Additional Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, thank you message, etc."
                  className="w-full h-24 px-3 py-2 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <Card className="lg:sticky lg:top-8">
              <CardContent>
                <h3 className="font-medium text-foreground mb-4">Invoice Summary</h3>
                
                {/* Transaction Type */}
                {selectedClient && (
                  <div className="mb-4 p-2 bg-primary/5 border border-primary/20 rounded text-xs">
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {totals.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                      </span>
                    </p>
                    {totals.businessState && totals.clientState && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {totals.businessState} → {totals.clientState}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.cgst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST (9%)</span>
                      <span className="text-foreground">{formatCurrency(totals.cgst)}</span>
                    </div>
                  )}
                  {totals.sgst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST (9%)</span>
                      <span className="text-foreground">{formatCurrency(totals.sgst)}</span>
                    </div>
                  )}
                  {totals.igst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IGST (18%)</span>
                      <span className="text-foreground">{formatCurrency(totals.igst)}</span>
                    </div>
                  )}
                  {totals.roundOff !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Round Off</span>
                      <span className="text-foreground">{formatCurrency(totals.roundOff)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="text-xl font-semibold text-foreground">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Select
                  label="Payment Due"
                  options={[
                    { value: '7', label: 'Due in 7 days' },
                    { value: '14', label: 'Due in 14 days' },
                    { value: '30', label: 'Due in 30 days' },
                    { value: '60', label: 'Due in 60 days' },
                  ]}
                  value={dueInDays}
                  onChange={(e) => setDueInDays(e.target.value)}
                />
                <Button type="submit" className="w-full mt-4" disabled={!canSubmit}>
                  <FileText className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
