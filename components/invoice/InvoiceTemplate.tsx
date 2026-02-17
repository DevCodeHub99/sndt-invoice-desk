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

const LAYOUT = {
  compactThreshold: 8,
  padding: {
    standard: 'p-8',
    compact: 'p-5',
  },
  fontSize: {
    standard: 'text-xs',
    compact: 'text-[11px]',
    smallStandard: 'text-[11px]',
    smallCompact: 'text-[10px]',
  },
  tablePadding: {
    standard: 'py-3 px-2',
    compact: 'py-1.5 px-1.5',
  }
} as const;

export function InvoiceTemplate({ invoice, currentUser, className = '' }: InvoiceTemplateProps) {
  const roundOff = calculateRoundOff(invoice.total);
  const finalTotal = Math.round(invoice.total);

  const itemCount = invoice.items.length + (invoice.manpowerCharges?.length || 0);
  const isCompact = itemCount > LAYOUT.compactThreshold;

  const contentPadding = isCompact ? LAYOUT.padding.compact : LAYOUT.padding.standard;

  return (
    <div
      className={`bg-white mx-auto text-[#222831] ${className}`}
      style={{
        maxWidth: '210mm',
        minHeight: '290mm',
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <div className="border border-gray-300 rounded shadow-sm relative h-full flex flex-col">
        {/* Header */}
        <div className={`border-b border-gray-300 ${contentPadding} bg-gray-50`}>
          <InvoiceHeader invoice={invoice} currentUser={currentUser} isCompact={isCompact} />
        </div>

        {/* Body */}
        <div className={`flex-1 ${contentPadding}`}>
          <div className={`${isCompact ? 'mb-4' : 'mb-6'}`}>
            <BillingSection invoice={invoice} isCompact={isCompact} />
          </div>

          <div className={`${isCompact ? 'mb-4' : 'mb-6'}`}>
            <ItemsTable
              items={invoice.items}
              manpowerCharges={invoice.manpowerCharges}
              isCompact={isCompact}
            />
          </div>

          <div className="flex gap-8 justify-between items-start">
            {/* Left: Amount in Words, Notes, Payment */}
            <div className="flex-1 min-w-0">
              <div className={`${isCompact ? 'mb-4' : 'mb-6'}`}>
                <AmountInWords
                  amount={(invoice.advancePayment ?? 0) > 0
                    ? (invoice.balanceDue ?? finalTotal - (invoice.advancePayment ?? 0))
                    : finalTotal
                  }
                  isBalanceDue={(invoice.advancePayment ?? 0) > 0}
                  isCompact={isCompact}
                />
              </div>

              {invoice.notes && (
                <div className={`mb-4 rounded bg-gray-100 p-2 ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
                  <span className="font-semibold text-foreground">Note:</span> {invoice.notes}
                </div>
              )}

              <PaymentDetails
                currentUser={currentUser}
                invoiceNumber={invoice.invoiceNumber}
                isCompact={isCompact}
              />
            </div>

            {/* Right: Totals */}
            <div className={`shrink-0 ${isCompact ? 'w-[240px]' : 'w-[280px]'}`}>
              <TotalsSection
                invoice={invoice}
                roundOff={roundOff}
                finalTotal={finalTotal}
                isCompact={isCompact}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-gray-300 bg-gray-50 p-3 text-center text-[9px] text-muted-foreground">
          This is a computer generated invoice and does not require a physical signature.
          {currentUser?.businessDetails?.email && ` • Contact: ${currentUser.businessDetails.email}`}
        </div>
      </div>
    </div>
  );
}

function InvoiceHeader({ invoice, currentUser, isCompact }: { invoice: Invoice; currentUser: User | undefined, isCompact: boolean }) {
  return (
    <div className="flex justify-between items-start gap-5">
      <div className="flex items-center gap-4">
        <img src="/sndt logo.webp" alt="Logo" className={`${isCompact ? 'h-10' : 'h-12'} w-auto object-contain`} />
        <div className={isCompact ? 'max-w-[300px]' : 'max-w-[350px]'}>
          <h1 className={`${isCompact ? 'text-lg' : 'text-xl'} font-extrabold text-foreground leading-tight`}>
            {currentUser?.businessDetails?.companyName}
          </h1>
          <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-muted-foreground mt-0.5 mb-1 leading-snug`}>
            {currentUser?.businessDetails?.billingAddress}
            {(currentUser?.businessDetails?.billingAddress && (currentUser?.businessDetails?.billingCity || currentUser?.businessDetails?.billingState)) ? ', ' : ''}
            {currentUser?.businessDetails?.billingCity}
            {(currentUser?.businessDetails?.billingCity && currentUser?.businessDetails?.billingState) ? ', ' : ''}
            {currentUser?.businessDetails?.billingState}
            {currentUser?.businessDetails?.billingZipCode ? ` - ${currentUser?.businessDetails?.billingZipCode}` : ''}
          </p>
          <div className={`flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground leading-tight ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
            {currentUser?.businessDetails?.taxId && <span><strong className="font-semibold text-muted-foreground">GSTIN:</strong> <span className="text-foreground">{currentUser.businessDetails.taxId}</span></span>}
            {currentUser?.businessDetails?.phones && currentUser.businessDetails.phones.length > 0 && <span><strong className="font-semibold text-muted-foreground">Phone:</strong> <span className="text-foreground">{currentUser.businessDetails.phones.join(' / ')}</span></span>}
            {currentUser?.businessDetails?.email && <span><strong className="font-semibold text-muted-foreground">Email:</strong> <span className="text-foreground">{currentUser.businessDetails.email}</span></span>}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-foreground tracking-wide`}>INVOICE</p>
        <p className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold mt-1`}># {invoice.invoiceNumber}</p>
        <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} text-muted-foreground mt-0.5`}>Date: {formatDate(invoice.createdAt)}</p>
      </div>
    </div>
  );
}

function BillingSection({ invoice, isCompact }: { invoice: Invoice, isCompact: boolean }) {
  const labelClass = `${isCompact ? 'text-[9px]' : 'text-[10px]'} font-bold text-muted-foreground uppercase tracking-wide mb-1`;
  const contentClass = `${isCompact ? 'text-[11px]' : 'text-[12px]'} text-foreground leading-snug`;

  return (
    <div className={`flex gap-10 border border-gray-200 rounded ${isCompact ? 'p-3' : 'p-4'} bg-gray-50/30`}>
      <div className="flex-1">
        <p className={labelClass}>Bill To / Ship To</p>
        <div className={contentClass}>
          <p className="font-semibold">{invoice.clientName}</p>
          <p className="whitespace-pre-wrap">{invoice.clientAddress}</p>
        </div>
      </div>
      <div className="flex-1 border-l border-dashed border-gray-300 pl-5">
        <p className={labelClass}>Details</p>
        <div className={contentClass}>
          {invoice.clientGstin && <p className="mb-0.5"><strong>GSTIN:</strong> {invoice.clientGstin}</p>}
          <p><strong>Place of Supply:</strong> {getStateFromGSTIN(invoice.clientGstin || '')} ({invoice.clientGstin?.substring(0, 2)})</p>
        </div>
      </div>
    </div>
  );
}

function ItemsTable({ items, manpowerCharges, isCompact }: {
  items: Invoice['items'];
  manpowerCharges?: Invoice['manpowerCharges'];
  isCompact: boolean;
}) {
  const thClass = `${isCompact ? 'py-1.5 px-1 text-[10px]' : 'py-2.5 px-2 text-[11px]'} font-bold text-muted-foreground border-b border-gray-300 uppercase tracking-wide text-left`;
  const tdClass = `${isCompact ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-[11px]'} border-b border-gray-100 align-top text-foreground`;

  return (
    <div className="overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className={`${thClass} w-[5%]`}>#</th>
            <th className={`${thClass} w-[45%]`}>Description</th>
            <th className={`${thClass} text-center w-[10%]`}>HSN/SAC</th>
            <th className={`${thClass} text-center w-[8%]`}>Qty</th>
            <th className={`${thClass} text-right w-[12%]`}>Rate</th>
            <th className={`${thClass} text-right w-[8%]`}>Tax</th>
            <th className={`${thClass} text-right w-[12%]`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className={`${tdClass} text-muted-foreground`}>{idx + 1}</td>
              <td className={tdClass}>
                <div className={`font-semibold overflow-hidden whitespace-nowrap text-ellipsis ${isCompact ? 'max-w-[280px]' : 'max-w-[320px]'}`}>
                  {item.productName}
                </div>
                {item.description && (
                  <div className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis ${isCompact ? 'max-w-[280px]' : 'max-w-[320px]'} mt-px`}>
                    {item.description}
                  </div>
                )}
              </td>
              <td className={`${tdClass} text-center`}>{item.hsnSac || '-'}</td>
              <td className={`${tdClass} text-center`}>{item.quantity}</td>
              <td className={`${tdClass} text-right`}>{formatCurrency(item.unitPrice)}</td>
              <td className={`${tdClass} text-right`}>{item.taxRate}%</td>
              <td className={`${tdClass} text-right font-semibold`}>{formatCurrency(item.total)}</td>
            </tr>
          ))}

          {manpowerCharges && manpowerCharges.map((item, idx) => (
            <tr key={`mp-${idx}`}>
              <td className={`${tdClass} text-muted-foreground`}>{items.length + idx + 1}</td>
              <td className={tdClass}>
                <div className={`font-semibold overflow-hidden whitespace-nowrap text-ellipsis ${isCompact ? 'max-w-[280px]' : 'max-w-[320px]'}`}>
                  {item.description}
                </div>
              </td>
              <td className={`${tdClass} text-center`}>-</td>
              <td className={`${tdClass} text-center`}>{item.quantity}</td>
              <td className={`${tdClass} text-right`}>{formatCurrency(item.rate)}</td>
              <td className={`${tdClass} text-right`}>-</td>
              <td className={`${tdClass} text-right font-semibold`}>{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TotalsSection({
  invoice,
  roundOff,
  finalTotal,
  isCompact
}: {
  invoice: Invoice;
  roundOff: number;
  finalTotal: number;
  isCompact: boolean;
}) {
  const hasAdvance = (invoice.advancePayment ?? 0) > 0;
  const advanceAmount = invoice.advancePayment || 0;
  const balanceDue = hasAdvance ? (invoice.balanceDue ?? (finalTotal - advanceAmount)) : finalTotal;

  const taxableAmount = invoice.subtotal;
  const nonTaxableAmount = invoice.manpowerTotal || 0;

  const rowClass = `flex justify-between mb-${isCompact ? '1' : '1.5'} ${isCompact ? 'text-[10px]' : 'text-[11px]'}`;
  const labelClass = "text-muted-foreground";
  const valClass = "font-semibold text-foreground";

  return (
    <div className={`notification-card bg-gray-50/50 p-${isCompact ? '3' : '4'} rounded border border-gray-100`}>
      <div className={rowClass}>
        <span className={labelClass}>Taxable Amount</span>
        <span className={valClass}>{formatCurrency(taxableAmount)}</span>
      </div>

      {invoice.cgst > 0 && (
        <div className={rowClass}>
          <span className={labelClass}>CGST (9%)</span>
          <span className={valClass}>{formatCurrency(invoice.cgst)}</span>
        </div>
      )}
      {invoice.sgst > 0 && (
        <div className={rowClass}>
          <span className={labelClass}>SGST (9%)</span>
          <span className={valClass}>{formatCurrency(invoice.sgst)}</span>
        </div>
      )}
      {invoice.igst > 0 && (
        <div className={rowClass}>
          <span className={labelClass}>IGST (18%)</span>
          <span className={valClass}>{formatCurrency(invoice.igst)}</span>
        </div>
      )}

      {nonTaxableAmount > 0 && (
        <div className={rowClass}>
          <span className={labelClass}>Other Charges</span>
          <span className={valClass}>{formatCurrency(nonTaxableAmount)}</span>
        </div>
      )}

      {roundOff !== 0 ? (
        <div className={`${rowClass} border-b border-dashed border-gray-300 pb-${isCompact ? '1' : '1.5'}`}>
          <span className={labelClass}>Round Off</span>
          <span className={valClass}>{formatCurrency(roundOff)}</span>
        </div>
      ) : <div className={`border-b border-dashed border-gray-300 mb-${isCompact ? '1' : '1.5'}`}></div>}

      <div className={`flex justify-between items-center mt-${isCompact ? '1.5' : '2'}`}>
        <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold text-foreground`}>TOTAL</span>
        <span className={`${isCompact ? 'text-base' : 'text-lg'} font-extrabold text-foreground`}>{formatCurrency(finalTotal)}</span>
      </div>

      {hasAdvance && (
        <div className="border-t border-gray-200 mt-2 pt-2">
          <div className={rowClass}>
            <span className={labelClass}>Advance Paid</span>
            <span className={valClass}>- {formatCurrency(advanceAmount)}</span>
          </div>
          <div className="flex justify-between items-center mt-1 bg-gray-900/5 p-1.5 rounded">
            <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-bold text-foreground`}>Balance Due</span>
            <span className={`${isCompact ? 'text-sm' : 'text-base'} font-extrabold text-foreground`}>{formatCurrency(balanceDue)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AmountInWords({ amount, isBalanceDue = false, isCompact }: { amount: number; isBalanceDue?: boolean, isCompact: boolean }) {
  return (
    <div className="border-l-[3px] border-foreground pl-3">
      <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-semibold text-muted-foreground mb-0.5 uppercase`}>
        {isBalanceDue ? 'Balance Due In Words' : 'Total Amount In Words'}
      </p>
      <p className={`${isCompact ? 'text-[11px]' : 'text-[12px]'} font-medium text-foreground leading-snug`}>
        {numberToWords(amount)}
      </p>
    </div>
  );
}

function PaymentDetails({
  currentUser,
  invoiceNumber,
  isCompact
}: {
  currentUser: User | undefined;
  invoiceNumber: string;
  isCompact: boolean;
}) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const upiId = currentUser?.businessDetails?.upiId;
    const payeeName = currentUser?.businessDetails?.companyName;

    if (upiId && payeeName) {
      generateUPIQRCode({
        upiId,
        payeeName,
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

  if (!hasBankDetails && !hasUpiId) return null;

  return (
    <div className={`flex gap-6 mt-${isCompact ? '3' : '4'} pt-${isCompact ? '3' : '4'} border-t border-dashed border-gray-300`}>
      {hasBankDetails && (
        <div className="flex-1">
          <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-bold text-muted-foreground uppercase mb-1`}>Bank Details</p>
          <div className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} text-foreground space-y-0.5`}>
            <div className="flex"><span className="text-muted-foreground w-12 shrink-0">Bank:</span><span className="font-semibold">{currentUser?.businessDetails?.bankName || '-'}</span></div>
            {currentUser?.businessDetails?.accountHolderName && (
              <div className="flex"><span className="text-muted-foreground w-12 shrink-0">Holder:</span><span className="font-semibold">{currentUser.businessDetails.accountHolderName}</span></div>
            )}
            {currentUser?.businessDetails?.accountNumber && (
              <div className="flex"><span className="text-muted-foreground w-12 shrink-0">Acc No:</span><span className="font-mono font-semibold">{currentUser.businessDetails.accountNumber}</span></div>
            )}
            {currentUser?.businessDetails?.ifscCode && (
              <div className="flex"><span className="text-muted-foreground w-12 shrink-0">IFSC:</span><span className="font-mono font-semibold">{currentUser.businessDetails.ifscCode}</span></div>
            )}
          </div>
        </div>
      )}

      {hasUpiId && (
        <div className="flex items-center gap-3 bg-white border border-gray-200 p-1 rounded">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} className={`${isCompact ? 'w-16 h-16' : 'w-20 h-20'} block`} style={{ imageRendering: 'pixelated' }} alt="QR" />
          ) : (
            <div className={`${isCompact ? 'w-16 h-16' : 'w-20 h-20'} bg-gray-100 flex items-center justify-center text-[8px]`}>Loading</div>
          )}
          <div>
            <p className="text-[9px] text-muted-foreground mb-0">Scan to Pay</p>
            <p className="text-[10px] font-semibold text-foreground">{currentUser?.businessDetails?.upiId}</p>
          </div>
        </div>
      )}
    </div>
  );
}
