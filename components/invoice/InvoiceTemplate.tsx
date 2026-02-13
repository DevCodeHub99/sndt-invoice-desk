'use client';

import { useState, useEffect } from 'react';
import { Invoice, User } from '@/lib/types';
import { formatCurrency, formatDate, numberToWords, calculateRoundOff, getStateFromGSTIN } from '@/lib/utils';
import { generateUPIQRCode } from '@/lib/qr-generator';

interface InvoiceTemplateProps {
  invoice: Invoice;
  currentUser: User | undefined;
  className?: string;
}

/**
 * Reusable Invoice Template Component
 * Used for both dashboard preview and PDF generation
 * Maintains consistent styling across all invoice displays
 */
export function InvoiceTemplate({ invoice, currentUser, className = '' }: InvoiceTemplateProps) {
  const roundOff = calculateRoundOff(invoice.total);
  const finalTotal = Math.round(invoice.total);

  return (
    <div
      className={`bg-white mx-auto ${className}`}
      style={{
        color: '#222831',
        backgroundColor: '#fff',
        maxWidth: '210mm', // A4 width
      }}
    >
      <div className="border rounded-lg shadow-sm">
        {/* Header Section */}
        <InvoiceHeader invoice={invoice} currentUser={currentUser} />

        {/* Main Content */}
        <div className="px-8 py-4 space-y-4">
          {/* Billing Information */}
          <BillingSection invoice={invoice} />

          {/* Items Table - Combined Products and Manpower */}
          <ItemsTable
            items={invoice.items}
            manpowerCharges={invoice.manpowerCharges}
          />

          {/* Totals and Notes */}
          <TotalsSection
            invoice={invoice}
            roundOff={roundOff}
            finalTotal={finalTotal}
          />

          {/* Amount in Words */}
          <AmountInWords
            amount={(invoice.advancePayment ?? 0) > 0
              ? (invoice.balanceDue ?? finalTotal - (invoice.advancePayment ?? 0))
              : finalTotal
            }
            isBalanceDue={(invoice.advancePayment ?? 0) > 0}
          />

          {/* Payment Details with UPI QR Code */}
          <PaymentDetails
            currentUser={currentUser}
            invoiceNumber={invoice.invoiceNumber}
          />

          {/* Footer Notice */}
          <FooterNotice email={currentUser?.businessDetails?.email} />
        </div>
      </div>
    </div>
  );
}

// Header Component
function InvoiceHeader({ invoice, currentUser }: { invoice: Invoice; currentUser: User | undefined }) {
  return (
    <div className="border-b-2 border-foreground px-6 py-4">
      <div className="flex items-start gap-2">
        <img src="/sndt logo.webp" alt="Company Logo" className="mt-2 h-12 w-auto" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {currentUser?.businessDetails?.companyName}
          </h1>
          <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <CompanyInfo currentUser={currentUser} />
            <RegistrationInfo currentUser={currentUser} />
          </div>
        </div>
        <InvoiceInfo invoice={invoice} />
      </div>
    </div>
  );
}

// Company Information
function CompanyInfo({ currentUser }: { currentUser: User | undefined }) {
  return (
    <div className="space-y-0.5">
      <p>{currentUser?.businessDetails?.billingAddress}</p>
      <p>
        {currentUser?.businessDetails?.billingCity}, {currentUser?.businessDetails?.billingState}{' '}
        {currentUser?.businessDetails?.billingZipCode}
      </p>
      {currentUser?.businessDetails?.email && (
        <p className="text-muted-foreground">
          Email: <span className="text-foreground">{currentUser.businessDetails.email}</span>
        </p>
      )}
      {currentUser?.businessDetails?.phones && currentUser.businessDetails.phones.length > 0 && (
        <p className="text-muted-foreground">
          Phone: <span className="font-bold text-foreground">{currentUser.businessDetails.phones.join(' / ')}</span>
        </p>
      )}
      {currentUser?.businessDetails?.website && (
        <p className="text-muted-foreground">
          Website: <span className="font-bold text-foreground">{currentUser.businessDetails.website}</span>
        </p>
      )}
    </div>
  );
}

// Registration Information
function RegistrationInfo({ currentUser }: { currentUser: User | undefined }) {
  return (
    <div className="space-y-0.5">
      {currentUser?.businessDetails?.registrationNumber && (
        <p className="font-medium text-foreground">
          Reg. No: {currentUser.businessDetails.registrationNumber}
        </p>
      )}
      {currentUser?.businessDetails?.municipalTradeCertificate && (
        <p className="font-medium text-foreground">
          Municipal Certi: {currentUser.businessDetails.municipalTradeCertificate}
        </p>
      )}
      {currentUser?.businessDetails?.taxId && (
        <p className="font-medium text-foreground">
          GSTIN: {currentUser.businessDetails.taxId}
        </p>
      )}
    </div>
  );
}

// Invoice Number and Date
function InvoiceInfo({ invoice }: { invoice: Invoice }) {
  return (
    <div className="text-right border-l-2 border-foreground pl-4">
      <p className="text-xs font-semibold text-muted-foreground">INVOICE</p>
      <p className="text-xl font-bold text-foreground mt-1">{invoice.invoiceNumber}</p>
      <p className="text-sm font-bold text-foreground mt-2">{formatDate(invoice.createdAt)}</p>
    </div>
  );
}

// Billing Section
function BillingSection({ invoice }: { invoice: Invoice }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
        Billing To
      </p>
      <div className="grid grid-cols-2 gap-8 text-xs">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{invoice.clientName}</p>
          <p className="text-muted-foreground">{invoice.clientAddress}</p>
        </div>
        <div className="space-y-1 text-right">
          {invoice.clientGstin && (
            <>
              <p className="text-muted-foreground">
                GSTIN: <span className="font-semibold text-foreground">{invoice.clientGstin}</span>
              </p>
              <p className="text-muted-foreground">
                Place of Supply:{' '}
                <span className="font-semibold text-foreground">
                  {getStateFromGSTIN(invoice.clientGstin)} ({invoice.clientGstin.substring(0, 2)})
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Items Table - Combined Products and Manpower
function ItemsTable({ items, manpowerCharges }: {
  items: Invoice['items'];
  manpowerCharges?: Invoice['manpowerCharges'];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-3 px-2 font-semibold text-foreground">Description</th>
            <th className="text-center py-3 px-2 font-semibold text-foreground text-xs">HSN/SAC</th>
            <th className="text-center py-3 px-2 font-semibold text-foreground">Qty</th>
            <th className="text-right py-3 px-2 font-semibold text-foreground">Rate</th>
            <th className="text-right py-3 px-2 font-semibold text-foreground">Tax %</th>
            <th className="text-right py-3 px-2 font-semibold text-foreground">Amount</th>
          </tr>
        </thead>
        <tbody>
          {/* Product Items */}
          {items.map((item, idx) => (
            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/10'}>
              <td className="py-2 px-2">
                <p className="font-medium text-foreground">{item.productName}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
              </td>
              <td className="text-center py-2 px-2 text-foreground font-medium">
                {item.hsnSac || '-'}
              </td>
              <td className="text-center py-2 px-2 text-foreground">{item.quantity}</td>
              <td className="text-right py-2 px-2 text-foreground">{formatCurrency(item.unitPrice)}</td>
              <td className="text-right py-2 px-2 text-foreground">{item.taxRate}%</td>
              <td className="text-right py-2 px-2 font-semibold text-foreground">
                {formatCurrency(item.total)}
              </td>
            </tr>
          ))}

          {/* Manpower Charges - No GST */}
          {manpowerCharges && manpowerCharges.length > 0 && manpowerCharges.map((item, idx) => (
            <tr key={`manpower-${idx}`} className={(items.length + idx) % 2 === 0 ? 'bg-white' : 'bg-muted/10'}>
              <td className="py-2 px-2 font-medium text-foreground">{item.description}</td>
              <td className="text-center py-2 px-2 text-foreground font-medium">-</td>
              <td className="text-center py-2 px-2 text-foreground">{item.quantity}</td>
              <td className="text-right py-2 px-2 text-foreground">{formatCurrency(item.rate)}</td>
              <td className="text-right py-2 px-2 text-foreground">-</td>
              <td className="text-right py-2 px-2 font-semibold text-foreground">
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Totals Section
function TotalsSection({
  invoice,
  roundOff,
  finalTotal
}: {
  invoice: Invoice;
  roundOff: number;
  finalTotal: number;
}) {
  const hasAdvance = (invoice.advancePayment ?? 0) > 0;
  const advanceAmount = invoice.advancePayment || 0;
  const balanceDue = hasAdvance ? (invoice.balanceDue ?? (finalTotal - advanceAmount)) : finalTotal;

  // Calculate totals for clear breakdown
  const taxableAmount = invoice.subtotal; // Items with GST
  const nonTaxableAmount = invoice.manpowerTotal || 0; // Items without GST

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        {invoice.notes && (
          <div className="text-xs">
            <p className="font-semibold text-foreground mb-2">Notes</p>
            <p className="text-muted-foreground">{invoice.notes}</p>
          </div>
        )}
      </div>
      <div></div>
      <div className="space-y-1.5 text-xs border-l-2 border-black pl-4">
        {/* Step 1: Taxable Items Subtotal */}
        <TotalLine label="Taxable Amount" amount={taxableAmount} />

        {/* Step 2: Tax Breakdown */}
        {invoice.cgst > 0 && <TotalLine label="  CGST @ 9%" amount={invoice.cgst} />}
        {invoice.sgst > 0 && <TotalLine label="  SGST @ 9%" amount={invoice.sgst} />}
        {invoice.igst > 0 && <TotalLine label="  IGST @ 18%" amount={invoice.igst} />}

        {/* Step 3: Non-Taxable Items (if any) */}
        {nonTaxableAmount > 0 && (
          <TotalLine label="Other Charges (No GST)" amount={nonTaxableAmount} />
        )}

        {/* Step 4: Round Off (if any) */}
        {roundOff !== 0 && <TotalLine label="Round Off" amount={roundOff} />}

        {/* Separator Line */}
        <div className="border-t-2 border-black my-2"></div>

        {/* Step 5: TOTAL INVOICE VALUE */}
        <div className="flex justify-between py-2 font-bold bg-gray-50 -mx-4 px-4">
          <span className="text-foreground text-sm">TOTAL</span>
          <span className="text-xl text-foreground font-bold">{formatCurrency(finalTotal)}</span>
        </div>

        {/* Step 6: Advance Payment (if any) */}
        {hasAdvance && (
          <>
            <div className="border-t border-dashed border-gray-300 my-2"></div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Less: Advance Received</span>
              <span className="text-red-600 font-semibold">- {formatCurrency(invoice.advancePayment!)}</span>
            </div>

            {/* Separator Line */}
            <div className="border-t-2 border-foreground my-2"></div>

            {/* Step 7: BALANCE DUE */}
            <div className="flex justify-between py-2 bg-gray-100 -mx-4 px-4 rounded">
              <span className="text-foreground font-bold text-sm">BALANCE DUE</span>
              <span className="text-2xl text-foreground font-bold">{formatCurrency(balanceDue)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Total Line Item
function TotalLine({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{formatCurrency(amount)}</span>
    </div>
  );
}

// Amount in Words
function AmountInWords({ amount, isBalanceDue = false }: { amount: number; isBalanceDue?: boolean }) {
  return (
    <div className={`${isBalanceDue ? 'bg-gray-100 border-l-4 border-foreground' : 'bg-gray-100 border-l-4 border-black'} p-3 rounded text-xs`}>
      <p className="text-foreground">
        <span className="font-semibold">{isBalanceDue ? 'Balance Due in Words: ' : 'Amount in Words: '}</span>
        <span className="font-medium">{numberToWords(amount)}</span>
      </p>
    </div>
  );
}

// Payment Details with UPI QR Code
function PaymentDetails({
  currentUser,
  invoiceNumber
}: {
  currentUser: User | undefined;
  invoiceNumber: string;
}) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // Generate QR code if UPI ID is available (no amount - user pays custom amount)
    const upiId = currentUser?.businessDetails?.upiId;
    const payeeName = currentUser?.businessDetails?.companyName;

    if (upiId && payeeName) {
      generateUPIQRCode({
        upiId,
        payeeName,
        // No amount - customer enters their own amount when paying
        transactionNote: `Payment for Invoice ${invoiceNumber}`,
        transactionRef: invoiceNumber,
      }, {
        width: 120,
        margin: 1,
      }).then(dataUrl => {
        setQrCodeDataUrl(dataUrl);
      }).catch(err => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [currentUser, invoiceNumber]);

  const hasBankDetails = currentUser?.businessDetails?.bankName ||
    currentUser?.businessDetails?.accountNumber ||
    currentUser?.businessDetails?.ifscCode;

  const hasUpiId = currentUser?.businessDetails?.upiId;

  // Don't render if no payment details
  if (!hasBankDetails && !hasUpiId) {
    return null;
  }

  return (
    <div className="border-t-2 border-foreground pt-4">
      <p className="font-bold text-foreground uppercase tracking-wide text-xs mb-3">
        Payment Details
      </p>

      <div className="grid grid-cols-[1fr_auto] items-start gap-8">
        {/* Left Side: Bank Details */}
        <div className="space-y-1.5 text-xs">
          {currentUser?.businessDetails?.bankName && (
            <PaymentDetailLine
              label="Bank Name"
              value={currentUser.businessDetails.bankName}
            />
          )}
          {currentUser?.businessDetails?.accountHolderName && (
            <PaymentDetailLine
              label="Account Holder"
              value={currentUser.businessDetails.accountHolderName}
            />
          )}
          {currentUser?.businessDetails?.accountNumber && (
            <PaymentDetailLine
              label="Account Number"
              value={currentUser.businessDetails.accountNumber}
              mono
            />
          )}
          {currentUser?.businessDetails?.ifscCode && (
            <PaymentDetailLine
              label="IFSC Code"
              value={currentUser.businessDetails.ifscCode}
              mono
            />
          )}
        </div>

        {/* Right Side: UPI QR Code */}
        {hasUpiId && (
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground font-medium mb-2">Scan to Pay</p>
            {qrCodeDataUrl ? (
              <div className="border border-gray-300 rounded-lg p-2 bg-white shadow-sm">
                <img
                  src={qrCodeDataUrl}
                  alt="UPI Payment QR Code"
                  className="w-32 h-32"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            ) : (
              <div className="w-32 h-32 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            )}
            {/* UPI Logo and App Support */}
            <div className="mt-2 flex items-center gap-1.5">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"
                alt="UPI"
                className="h-5"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-xs text-muted-foreground">
                {currentUser?.businessDetails?.upiId}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Payment Detail Line
function PaymentDetailLine({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className={`text-foreground font-semibold ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

// Footer Notice
function FooterNotice({ email }: { email?: string }) {
  return (
    <div className="text-center text-xs border-t border-muted pt-3 mt-3">
      <p className="text-muted-foreground font-medium">
        This invoice is electronically generated and does not require a physical signature.
      </p>
      <p className="text-muted-foreground text-xs mt-1">
        For inquiries, please contact {email || 'support'}
      </p>
    </div>
  );
}
