'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useProductsStore, useClientsStore, useInvoicesStore, useLaborStore } from '@/lib/store-mongodb';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatCurrency, getStateFromGSTIN } from '@/lib/utils';
import { Plus, Trash2, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import type { InvoiceItem } from '@/lib/types';

interface LineItem {
  id: string;
  productId: string;
  comment: string; // Optional admin note (date ref, extra info, etc.)
  quantity: number | string; // Allow string for empty state during editing
  unitPrice: number | string; // Allow string for empty state during editing
  taxRate: number;
}

interface ManpowerItem {
  id: string;
  laborId?: string; // Reference to saved labor charge
  description: string;
  quantity?: number | string; // Allow string for empty state during editing
  amount: number | string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const clients = useClientsStore((state) => state.clients);
  const fetchClients = useClientsStore((state) => state.fetchClients);
  const products = useProductsStore((state) => state.products);
  const fetchProducts = useProductsStore((state) => state.fetchProducts);
  const laborCharges = useLaborStore((state) => state.laborCharges);
  const fetchLaborCharges = useLaborStore((state) => state.fetchLaborCharges);
  const addInvoice = useInvoicesStore((state) => state.addInvoice);
  const [clientId, setClientId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{
    id: uuidv4(),
    productId: '',
    comment: '',
    quantity: 1,
    unitPrice: '',
    taxRate: currentUser?.businessDetails?.defaultTaxRate || 18
  }]);
  const [manpowerItems, setManpowerItems] = useState<ManpowerItem[]>([]);
  const [notes, setNotes] = useState('');
  const [dueInDays, setDueInDays] = useState('30');
  const [advancePayment, setAdvancePayment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients and products on mount
  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchLaborCharges();
  }, [fetchClients, fetchProducts, fetchLaborCharges]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const invoiceItems: InvoiceItem[] = useMemo(() => {
    return lineItems
      .filter((item) => item.productId)
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        // Use custom price if set, otherwise use product price
        // Convert string to number, default to 0 if empty
        const unitPrice = typeof item.unitPrice === 'string'
          ? (parseFloat(item.unitPrice) || 0)
          : (item.unitPrice || product.price);
        const quantity = typeof item.quantity === 'string'
          ? (parseInt(item.quantity) || 1)
          : (item.quantity || 1);
        const itemSubtotal = quantity * unitPrice;
        const itemTax = itemSubtotal * (item.taxRate / 100);
        return {
          id: item.id,
          productId: product.id,
          productName: product.name,
          description: item.comment.trim() || product.description || product.name,
          hsnSac: product.hsnSac,
          quantity: quantity,
          unitPrice: unitPrice,
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
      const quantity = typeof item.quantity === 'string'
        ? (parseInt(item.quantity) || 1)
        : (item.quantity || 1);
      const itemSubtotal = quantity * item.unitPrice;
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

    // Add manpower charges (no tax) - price × quantity
    const manpowerTotal = manpowerItems.reduce((sum, item) => {
      const price = typeof item.amount === 'string'
        ? (parseFloat(item.amount) || 0)
        : (item.amount || 0);
      const quantity = typeof item.quantity === 'string'
        ? (parseInt(item.quantity) || 1)
        : (item.quantity || 1);
      return sum + (price * quantity);
    }, 0);

    const totalTax = totalCgst + totalSgst + totalIgst;
    const total = subtotal + totalTax + manpowerTotal;
    const roundOff = Math.round(total) - total;
    const finalTotal = Math.round(total);

    // Calculate advance payment and balance due
    const advance = advancePayment ? (parseFloat(advancePayment) || 0) : 0;
    const balanceDue = Math.max(0, finalTotal - advance);

    return {
      subtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      manpowerTotal,
      roundOff,
      total: finalTotal,
      advancePayment: advance,
      balanceDue,
      isInterState: isInterState || false,
      businessState,
      clientState
    };
  }, [invoiceItems, manpowerItems, selectedClient, currentUser?.businessDetails?.taxId, advancePayment]);

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: uuidv4(),
      productId: '',
      comment: '',
      quantity: 1,
      unitPrice: '',
      taxRate: currentUser?.businessDetails?.defaultTaxRate || 18
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const addManpowerItem = () => {
    setManpowerItems([...manpowerItems, {
      id: uuidv4(),
      laborId: '',
      description: '',
      quantity: 1,
      amount: ''
    }]);
  };

  const removeManpowerItem = (id: string) => {
    setManpowerItems(manpowerItems.filter((item) => item.id !== id));
  };

  const updateManpowerItem = (id: string, field: keyof ManpowerItem, value: string | number) => {
    setManpowerItems(manpowerItems.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };

        // When labor charge is selected, auto-fill details
        if (field === 'laborId' && value) {
          const labor = laborCharges.find(l => l.id === value);
          if (labor) {
            updated.description = labor.name;
            updated.amount = labor.rate; // Set default price
            updated.quantity = 1; // Always set quantity to 1
          }
        }

        return updated;
      }
      return item;
    }));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // When product changes, set the default price
        if (field === 'productId') {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.unitPrice = product.price;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || invoiceItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const client = clients.find((c) => c.id === clientId)!;
      const clientAddress = [client.billingAddress, client.billingCity, client.billingState, client.billingZipCode, client.billingCountry]
        .filter(Boolean)
        .join(', ');

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(dueInDays));

      // Prepare manpower charges with quantity
      const manpowerCharges = manpowerItems
        .filter(item => item.description.trim())
        .map(item => {
          const price = typeof item.amount === 'string'
            ? (parseFloat(item.amount) || 0)
            : (item.amount || 0);
          const quantity = typeof item.quantity === 'string'
            ? (parseInt(item.quantity) || 1)
            : (item.quantity || 1);
          return {
            description: item.description,
            quantity: quantity,
            rate: price,
            amount: price * quantity
          };
        });

      const success = await addInvoice({
        clientId: client.id,
        clientName: client.companyName,
        clientAddress,
        clientGstin: client.taxId,
        clientState: client.billingState,
        placeOfSupply: `${client.billingState} - ${getStateFromGSTIN(client.taxId)}`,
        isInterState: totals.isInterState,
        items: invoiceItems,
        manpowerCharges: manpowerCharges.length > 0 ? manpowerCharges : undefined,
        subtotal: totals.subtotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        manpowerTotal: totals.manpowerTotal > 0 ? totals.manpowerTotal : undefined,
        roundOff: totals.roundOff,
        total: totals.total,
        advancePayment: totals.advancePayment > 0 ? totals.advancePayment : undefined,
        balanceDue: totals.advancePayment > 0 ? totals.balanceDue : undefined,
        status: totals.advancePayment > 0 ? (totals.balanceDue === 0 ? 'paid' : 'partial') : 'pending',
        notes,
        dueDate,
      });

      if (success) {
        router.push('/invoices');
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      setIsSubmitting(false);
    }
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
                    // Handle both string and number for unitPrice
                    const unitPrice = typeof item.unitPrice === 'string'
                      ? (parseFloat(item.unitPrice) || 0)
                      : (item.unitPrice || (product?.price || 0));
                    const quantity = typeof item.quantity === 'string'
                      ? (parseInt(item.quantity) || 1)
                      : (item.quantity || 1);
                    const itemSubtotal = quantity * unitPrice;
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
                            />
                          </div>
                          <div className="w-24 sm:w-28">
                            <Input
                              label={index === 0 ? 'Price' : undefined}
                              type="text"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty string or valid number input
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  updateLineItem(item.id, 'unitPrice', value);
                                }
                              }}
                              onBlur={(e) => {
                                // On blur, ensure we have a valid number
                                const value = e.target.value;
                                if (value === '' || parseFloat(value) === 0) {
                                  updateLineItem(item.id, 'unitPrice', product?.price || 0);
                                }
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="w-20 sm:w-24">
                            <Input
                              label={index === 0 ? 'Qty' : undefined}
                              type="text"
                              value={item.quantity === '' ? '' : item.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty string or positive integers
                                if (value === '' || /^\d+$/.test(value)) {
                                  updateLineItem(item.id, 'quantity', value);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (value === '' || parseInt(value) < 1) {
                                  updateLineItem(item.id, 'quantity', 1);
                                }
                              }}
                              placeholder="1"
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
                        {/* Optional comment/note for this item */}
                        <input
                          type="text"
                          value={item.comment}
                          onChange={(e) => updateLineItem(item.id, 'comment', e.target.value)}
                          placeholder="Add note (e.g. date ref, challan no, remarks...)"
                          className="w-full px-3 py-1.5 text-xs rounded-md border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                        />
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

            {/* Manpower Charges */}
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground text-sm sm:text-base">Manpower Charges</h3>
                  <span className="text-xs text-muted-foreground">(No GST)</span>
                </div>
                {manpowerItems.length > 0 ? (
                  <div className="space-y-3">
                    {manpowerItems.map((item, index) => {
                      const labor = laborCharges.find(l => l.id === item.laborId);
                      const calculatedAmount = typeof item.amount === 'string'
                        ? (parseFloat(item.amount) || 0)
                        : (item.amount || 0);
                      const quantity = typeof item.quantity === 'string'
                        ? (parseInt(item.quantity) || 1)
                        : (item.quantity || 1);

                      return (
                        <div key={item.id} className="flex flex-col gap-2 p-3 sm:p-4 bg-muted/30 rounded-lg border">
                          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
                            {/* Labor Charge Dropdown */}
                            <div className="flex-1">
                              <SearchableSelect
                                label={index === 0 ? 'Labor Charge' : undefined}
                                options={[
                                  { value: '', label: 'Select labor charge...' },
                                  ...laborCharges.map(l => ({
                                    value: l.id,
                                    label: `${l.name} - ${l.rateType === 'fixed' ? formatCurrency(l.rate) : `${formatCurrency(l.rate)}${l.unit ? ` ${l.unit}` : '/qty'}`}`
                                  }))
                                ]}
                                value={item.laborId || ''}
                                onChange={(value) => updateManpowerItem(item.id, 'laborId', value)}
                                placeholder="Select labor charge..."
                              />
                            </div>

                            {/* Price Field - Always editable */}
                            <div className="w-24 sm:w-28">
                              <Input
                                label={index === 0 ? 'Price' : undefined}
                                type="text"
                                value={item.amount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    updateManpowerItem(item.id, 'amount', value);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  if (value === '' && labor) {
                                    // Restore default price if empty
                                    updateManpowerItem(item.id, 'amount', labor.rate);
                                  }
                                }}
                                placeholder="0.00"
                              />
                            </div>

                            {/* Quantity Field - Always visible */}
                            <div className="w-20 sm:w-24">
                              <Input
                                label={index === 0 ? 'Qty' : undefined}
                                type="text"
                                value={item.quantity === '' ? '' : (item.quantity !== undefined ? item.quantity : 1)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow empty string or positive integers
                                  if (value === '' || /^\d+$/.test(value)) {
                                    updateManpowerItem(item.id, 'quantity', value);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || parseInt(value) < 1) {
                                    updateManpowerItem(item.id, 'quantity', 1);
                                  }
                                }}
                                placeholder="1"
                              />
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => removeManpowerItem(item.id)}
                              className="h-10 px-3 rounded-lg hover:bg-danger/10 transition-colors"
                              aria-label="Remove manpower charge"
                            >
                              <Trash2 className="w-4 h-4 text-danger" />
                            </button>
                          </div>

                          {/* Calculation Display */}
                          {labor && (
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              <p className="font-medium text-foreground">
                                {quantity} × {formatCurrency(calculatedAmount)} = {formatCurrency(quantity * calculatedAmount)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    Add labor charges like loading, unloading, installation, etc.
                  </p>
                )}
                <Button type="button" variant="secondary" onClick={addManpowerItem} className="mt-4 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manpower Charge
                </Button>
                {laborCharges.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No labor charges yet.{' '}
                    <Link href="/labor" className="text-primary hover:underline">
                      Add labor charges first
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

                <div className="space-y-2">
                  {/* Step 1: Taxable Items */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxable Amount</span>
                    <span className="text-foreground font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>

                  {/* Step 2: Tax Breakdown */}
                  {totals.cgst > 0 && (
                    <div className="flex justify-between text-sm pl-3">
                      <span className="text-muted-foreground">CGST @ 9%</span>
                      <span className="text-foreground">{formatCurrency(totals.cgst)}</span>
                    </div>
                  )}
                  {totals.sgst > 0 && (
                    <div className="flex justify-between text-sm pl-3">
                      <span className="text-muted-foreground">SGST @ 9%</span>
                      <span className="text-foreground">{formatCurrency(totals.sgst)}</span>
                    </div>
                  )}
                  {totals.igst > 0 && (
                    <div className="flex justify-between text-sm pl-3">
                      <span className="text-muted-foreground">IGST @ 18%</span>
                      <span className="text-foreground">{formatCurrency(totals.igst)}</span>
                    </div>
                  )}

                  {/* Step 3: Non-Taxable Items */}
                  {totals.manpowerTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Other Charges (No GST)</span>
                      <span className="text-foreground font-medium">{formatCurrency(totals.manpowerTotal)}</span>
                    </div>
                  )}

                  {/* Step 4: Round Off */}
                  {totals.roundOff !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Round Off</span>
                      <span className="text-foreground">{formatCurrency(totals.roundOff)}</span>
                    </div>
                  )}

                  {/* Separator */}
                  <div className="border-t-2 border-gray-300 my-2"></div>

                  {/* Step 5: Total */}
                  <div className="flex justify-between bg-gray-100 -mx-4 px-4 py-2 rounded">
                    <span className="font-bold text-foreground">TOTAL</span>
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(totals.total)}</span>
                  </div>

                  {/* Step 6: Advance Payment Section */}
                  <div className="border-t-2 border-gray-300 pt-3 mt-3">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Advance Payment Received
                    </label>
                    <Input
                      type="text"
                      value={advancePayment}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setAdvancePayment(value);
                        }
                      }}
                      placeholder="Enter advance amount..."
                      className="mb-2"
                    />
                    {totals.advancePayment > 0 && (
                      <div className="space-y-2 mt-3">
                        <div className="flex justify-between text-sm border-t border-dashed border-gray-300 pt-2">
                          <span className="text-muted-foreground">Less: Advance Received</span>
                          <span className="text-red-600 font-semibold">- {formatCurrency(totals.advancePayment)}</span>
                        </div>

                        {/* Separator */}
                        <div className="border-t-2 border-foreground my-2"></div>

                        {/* Step 7: Balance Due */}
                        <div className="flex justify-between bg-gray-100 -mx-4 px-4 py-3 rounded">
                          <span className="text-foreground font-bold">BALANCE DUE</span>
                          <span className="text-2xl text-foreground font-bold">{formatCurrency(totals.balanceDue)}</span>
                        </div>
                      </div>
                    )}
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
                <Button type="submit" className="w-full mt-4" disabled={!canSubmit || isSubmitting}>
                  <FileText className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
