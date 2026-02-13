import { Invoice, User } from './types';
import { formatCurrency, formatDate, numberToWords, getStateFromGSTIN } from './utils';
import { generateUPIQRCode } from './qr-generator';

/**
 * Invoice PDF Generator
 * Generates a PDF from invoice data using html2canvas and jsPDF
 * Maintains consistent styling with the dashboard preview
 */

// Color constants - consistent neutral theme (no blue)
const COLORS = {
  foreground: '#222831',
  muted: '#393E46',
  border: '#d1d1d1',
  black: '#000000',
  white: '#ffffff',
  grayBg: '#f3f4f6',
  grayLight: '#f9fafb',
  grayAlt: 'rgba(229, 229, 229, 0.1)',
  // Danger red for deductions
  danger: '#dc2626', // red-600
  dangerLight: '#fee2e2', // red-50
} as const;

export async function generateInvoicePDF(invoice: Invoice, currentUser: User | undefined) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Pre-generate QR code if UPI ID is available (no amount - user pays custom amount)
  let qrCodeDataUrl: string | null = null;
  const upiId = currentUser?.businessDetails?.upiId;
  const payeeName = currentUser?.businessDetails?.companyName;

  if (upiId && payeeName) {
    try {
      qrCodeDataUrl = await generateUPIQRCode({
        upiId,
        payeeName,
        // No amount - customer enters their own amount when paying
        transactionNote: `Payment for Invoice ${invoice.invoiceNumber}`,
        transactionRef: invoice.invoiceNumber,
      }, {
        width: 120,
        margin: 1,
      });
    } catch (err) {
      console.error('Failed to generate QR code for PDF:', err);
    }
  }

  const container = createPDFContainer();
  container.innerHTML = generateInvoiceHTML(invoice, currentUser, qrCodeDataUrl);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: COLORS.white,
      allowTaint: true,
      foreignObjectRendering: false,
    });

    const pdf = createPDFDocument();
    addImageToPDFMultiPage(pdf, canvas);

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Print invoice using the exact same HTML template as the PDF download.
 * Opens a new browser window with the styled invoice and triggers the print dialog.
 */
export async function printInvoice(invoice: Invoice, currentUser: User | undefined) {
  // Generate QR code if UPI ID available
  let qrCodeDataUrl: string | null = null;
  const upiId = currentUser?.businessDetails?.upiId;
  const payeeName = currentUser?.businessDetails?.companyName;

  if (upiId && payeeName) {
    try {
      qrCodeDataUrl = await generateUPIQRCode({
        upiId,
        payeeName,
        transactionNote: `Payment for Invoice ${invoice.invoiceNumber}`,
        transactionRef: invoice.invoiceNumber,
      }, {
        width: 120,
        margin: 1,
      });
    } catch (err) {
      console.error('Failed to generate QR code for print:', err);
    }
  }

  const invoiceHTML = generateInvoiceHTML(invoice, currentUser, qrCodeDataUrl);

  const printWindow = window.open('', '_blank', 'width=850,height=1100');
  if (!printWindow) {
    alert('Please allow popups to print the invoice.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          background: #fff;
          color: ${COLORS.foreground};
          width: 210mm;
          margin: 0 auto;
          padding: 0;
        }
        @media print {
          body { margin: 0; padding: 0; }
          @page { size: A4; margin: 8mm 5mm; }

          /* Prevent page breaks inside these elements */
          .invoice-header,
          .invoice-billing,
          .invoice-totals,
          .invoice-amount-words,
          .invoice-payment-details,
          .invoice-footer-notice {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Allow the items table to break across pages */
          .invoice-items-table {
            page-break-inside: auto;
            break-inside: auto;
          }
          .invoice-items-table thead {
            display: table-header-group;
          }
          .invoice-items-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Keep totals and payment together at bottom */
          .invoice-totals-group {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Avoid orphaned footer */
          .invoice-footer-notice {
            page-break-before: avoid;
            break-before: avoid;
          }
        }
      </style>
    </head>
    <body>
      ${invoiceHTML}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() { window.close(); };
            // Fallback: close after 2 seconds if onafterprint not supported
            setTimeout(function() { window.close(); }, 2000);
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function createPDFContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  // Do NOT set fixed height — let content flow naturally so html2canvas captures everything
  container.style.backgroundColor = COLORS.white;
  container.style.color = COLORS.foreground;
  container.style.padding = '0';
  return container;
}

function createPDFDocument() {
  const { jsPDF } = require('jspdf');
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
}

/**
 * Splits the rendered canvas across multiple A4 pages if the content exceeds one page.
 * This is the industry-standard approach for html2canvas + jsPDF multi-page PDFs.
 */
function addImageToPDFMultiPage(pdf: any, canvas: HTMLCanvasElement) {
  const pdfPageWidth = pdf.internal.pageSize.getWidth();   // 210mm
  const pdfPageHeight = pdf.internal.pageSize.getHeight();  // 297mm

  const margin = 5; // mm on each side
  const usableWidth = pdfPageWidth - margin * 2;
  const usableHeight = pdfPageHeight - margin * 2;

  // Calculate how tall the full image would be (in mm) when scaled to usableWidth
  const scaledFullHeight = (canvas.height * usableWidth) / canvas.width;

  // If it fits on one page, simple case
  if (scaledFullHeight <= usableHeight) {
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, scaledFullHeight);
    return;
  }

  // Multi-page: slice the source canvas into page-sized chunks
  const totalPages = Math.ceil(scaledFullHeight / usableHeight);
  // How many source pixels correspond to one PDF page of usable height
  const sourcePageHeight = Math.floor(canvas.height / totalPages);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    const sourceY = page * sourcePageHeight;
    const sourceH = Math.min(sourcePageHeight, canvas.height - sourceY);

    // Create a temporary canvas for this page's slice
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceH;

    const ctx = pageCanvas.getContext('2d');
    if (!ctx) continue;

    // Draw the relevant slice
    ctx.drawImage(
      canvas,
      0, sourceY,           // source x, y
      canvas.width, sourceH, // source width, height
      0, 0,                  // dest x, y
      canvas.width, sourceH  // dest width, height
    );

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    const sliceHeight = (sourceH * usableWidth) / canvas.width;

    pdf.addImage(pageImgData, 'JPEG', margin, margin, usableWidth, sliceHeight);
  }
}

function generateInvoiceHTML(invoice: Invoice, currentUser: User | undefined, qrCodeDataUrl: string | null): string {
  const roundOff = Math.round(invoice.total) - invoice.total;
  const finalTotal = Math.round(invoice.total);
  const hasAdvance = (invoice.advancePayment ?? 0) > 0;
  const advanceAmount = invoice.advancePayment || 0;
  const balanceDue = hasAdvance ? (invoice.balanceDue ?? (finalTotal - advanceAmount)) : finalTotal;

  return `
    <div style="font-family: Arial, sans-serif; color: ${COLORS.foreground}; background: ${COLORS.white}; padding: 0;">
      <div style="border: 1px solid ${COLORS.border}; border-radius: 8px; overflow: visible;">
        <div class="invoice-header">
          ${generateHeader(invoice, currentUser)}
        </div>
        <div style="padding: 32px;">
          <div class="invoice-billing">
            ${generateBillingSection(invoice)}
          </div>
          <div class="invoice-items-table">
            ${generateItemsTable(invoice)}
          </div>
          <div class="invoice-totals-group">
            <div class="invoice-totals">
              ${generateTotalsSection(invoice, roundOff, finalTotal)}
            </div>
            <div class="invoice-amount-words">
              ${generateAmountInWords(hasAdvance ? balanceDue : finalTotal, hasAdvance || false)}
            </div>
          </div>
          <div class="invoice-payment-details">
            ${generatePaymentDetails(currentUser, qrCodeDataUrl)}
          </div>
          <div class="invoice-footer-notice">
            ${generateFooterNotice(currentUser)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateHeader(invoice: Invoice, currentUser: User | undefined): string {
  return `
    <div style="border-bottom: 2px solid ${COLORS.foreground}; padding: 24px; display: flex; gap: 8px; align-items: flex-start;">
      <img src="/sndt logo.webp" alt="Company Logo" style="margin-top: 8px; height: 48px; width: auto;" />
      <div style="flex: 1;">
        <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: ${COLORS.foreground};">
          ${currentUser?.businessDetails?.companyName || 'Company'}
        </h1>
        <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">
          ${generateCompanyInfo(currentUser)}
          ${generateRegistrationInfo(currentUser)}
        </div>
      </div>
      ${generateInvoiceInfo(invoice)}
    </div>
  `;
}

function generateCompanyInfo(currentUser: User | undefined): string {
  return `
    <div style="line-height: 1.5;">
      <p style="margin: 0; color: ${COLORS.muted};">${currentUser?.businessDetails?.billingAddress || ''}</p>
      <p style="margin: 0; color: ${COLORS.muted};">
        ${currentUser?.businessDetails?.billingCity || ''}, 
        ${currentUser?.businessDetails?.billingState || ''} 
        ${currentUser?.businessDetails?.billingZipCode || ''}
      </p>
      ${currentUser?.businessDetails?.email ? `
        <p style="margin: 0; color: ${COLORS.muted};">
          Email: <span style="font-weight: bold; color: ${COLORS.foreground};">${currentUser.businessDetails.email}</span>
        </p>
      ` : ''}
      ${currentUser?.businessDetails?.phones?.length ? `
        <p style="margin: 0; color: ${COLORS.muted};">
          Phone: <span style="font-weight: bold; color: ${COLORS.foreground};">${currentUser.businessDetails.phones.join(' / ')}</span>
        </p>
      ` : ''}
    </div>
  `;
}

function generateRegistrationInfo(currentUser: User | undefined): string {
  return `
    <div style="line-height: 1.5;">
      ${currentUser?.businessDetails?.registrationNumber ? `
        <p style="margin: 0; font-weight: 500; color: ${COLORS.foreground};">
          Reg. No: ${currentUser.businessDetails.registrationNumber}
        </p>
      ` : ''}
      ${currentUser?.businessDetails?.municipalTradeCertificate ? `
        <p style="margin: 0; font-weight: 500; color: ${COLORS.foreground};">
          Municipal Certi: ${currentUser.businessDetails.municipalTradeCertificate}
        </p>
      ` : ''}
      ${currentUser?.businessDetails?.taxId ? `
        <p style="margin: 0; font-weight: 500; color: ${COLORS.foreground};">
          GSTIN: ${currentUser.businessDetails.taxId}
        </p>
      ` : ''}
    </div>
  `;
}

function generateInvoiceInfo(invoice: Invoice): string {
  return `
    <div style="text-align: right; border-left: 2px solid ${COLORS.foreground}; padding-left: 16px;">
      <p style="font-size: 11px; font-weight: 600; color: ${COLORS.muted}; margin: 0;">INVOICE</p>
      <p style="font-size: 20px; font-weight: bold; color: ${COLORS.foreground}; margin: 8px 0;">
        ${invoice.invoiceNumber}
      </p>
      <p style="font-size: 14px; font-weight: bold; color: ${COLORS.foreground}; margin: 8px 0;">
        ${formatDate(invoice.createdAt)}
      </p>
    </div>
  `;
}

function generateBillingSection(invoice: Invoice): string {
  return `
    <div style="margin-bottom: 16px;">
      <p style="font-size: 11px; font-weight: bold; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
        Billing To
      </p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; font-size: 12px;">
        <div style="line-height: 1.5;">
          <p style="font-weight: 600; color: ${COLORS.foreground}; margin: 0;">${invoice.clientName}</p>
          <p style="color: ${COLORS.muted}; margin: 0;">${invoice.clientAddress}</p>
        </div>
        <div style="text-align: right; line-height: 1.5;">
          ${invoice.clientGstin ? `
            <p style="color: ${COLORS.muted}; margin: 0;">
              GSTIN: <span style="font-weight: 600; color: ${COLORS.foreground};">${invoice.clientGstin}</span>
            </p>
            <p style="color: ${COLORS.muted}; margin: 0;">
              Place of Supply: <span style="font-weight: 600; color: ${COLORS.foreground};">
                ${getStateFromGSTIN(invoice.clientGstin)} (${invoice.clientGstin.substring(0, 2)})
              </span>
            </p>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function generateItemsTable(invoice: Invoice): string {
  const allItems = [
    // Product items with tax
    ...invoice.items.map((item, idx) => ({
      type: 'product',
      description: item.productName,
      subDescription: item.description || '',
      hsnSac: item.hsnSac || '-',
      quantity: item.quantity,
      rate: item.unitPrice,
      taxRate: `${item.taxRate}%`,
      amount: item.total,
      idx
    })),
    // Manpower charges without tax
    ...(invoice.manpowerCharges || []).map((item, idx) => ({
      type: 'manpower',
      description: item.description,
      subDescription: '',
      hsnSac: '-',
      quantity: item.quantity,
      rate: item.rate,
      taxRate: '-',
      amount: item.amount,
      idx: invoice.items.length + idx
    }))
  ];

  return `
    <div style="margin-bottom: 16px; overflow-x: auto;">
      <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid ${COLORS.black};">
            <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: ${COLORS.foreground};">Description</th>
            <th style="text-align: center; padding: 12px 8px; font-weight: 600; color: ${COLORS.foreground}; font-size: 11px;">HSN/SAC</th>
            <th style="text-align: center; padding: 12px 8px; font-weight: 600; color: ${COLORS.foreground};">Qty</th>
            <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: ${COLORS.foreground};">Rate</th>
            <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: ${COLORS.foreground};">Tax %</th>
            <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: ${COLORS.foreground};">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${allItems.map((item) => `
            <tr style="background: ${item.idx % 2 === 0 ? COLORS.white : COLORS.grayAlt};">
              <td style="padding: 8px;">
                <p style="font-weight: 500; margin: 0; color: ${COLORS.foreground};">${item.description}</p>
                ${item.subDescription ? `<p style="font-size: 11px; color: ${COLORS.muted}; margin: 2px 0 0 0;">${item.subDescription}</p>` : ''}
              </td>
              <td style="text-align: center; padding: 8px; color: ${COLORS.foreground}; font-weight: 500;">${item.hsnSac}</td>
              <td style="text-align: center; padding: 8px; color: ${COLORS.foreground};">${item.quantity}</td>
              <td style="text-align: right; padding: 8px; color: ${COLORS.foreground};">${formatCurrency(item.rate)}</td>
              <td style="text-align: right; padding: 8px; color: ${COLORS.foreground};">${item.taxRate}</td>
              <td style="text-align: right; padding: 8px; font-weight: 600; color: ${COLORS.foreground};">${formatCurrency(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateTotalsSection(invoice: Invoice, roundOff: number, finalTotal: number): string {
  const hasAdvance = (invoice.advancePayment ?? 0) > 0;
  const advanceAmount = invoice.advancePayment || 0;
  const balanceDue = hasAdvance ? (invoice.balanceDue ?? (finalTotal - advanceAmount)) : finalTotal;

  // Calculate totals for clear breakdown
  const taxableAmount = invoice.subtotal; // Items with GST
  const nonTaxableAmount = invoice.manpowerTotal || 0; // Items without GST

  return `
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div>
        ${invoice.notes ? `
          <div style="font-size: 12px;">
            <p style="font-weight: 600; color: ${COLORS.foreground}; margin: 0 0 8px 0;">Notes</p>
            <p style="color: ${COLORS.muted}; margin: 0;">${invoice.notes}</p>
          </div>
        ` : ''}
      </div>
      <div></div>
      <div style="font-size: 12px; border-left: 2px solid ${COLORS.black}; padding-left: 16px; line-height: 1.4;">
        <!-- Step 1: Taxable Amount -->
        ${generateTotalLine('Taxable Amount', taxableAmount)}
        
        <!-- Step 2: Tax Breakdown (indented) -->
        ${invoice.cgst > 0 ? generateTotalLine('  CGST @ 9%', invoice.cgst) : ''}
        ${invoice.sgst > 0 ? generateTotalLine('  SGST @ 9%', invoice.sgst) : ''}
        ${invoice.igst > 0 ? generateTotalLine('  IGST @ 18%', invoice.igst) : ''}
        
        <!-- Step 3: Non-Taxable Items -->
        ${nonTaxableAmount > 0 ? generateTotalLine('Other Charges (No GST)', nonTaxableAmount) : ''}
        
        <!-- Step 4: Round Off -->
        ${roundOff !== 0 ? generateTotalLine('Round Off', roundOff) : ''}
        
        <!-- Separator -->
        <div style="border-top: 2px solid ${COLORS.black}; margin: 8px 0;"></div>
        
        <!-- Step 5: TOTAL -->
        <div style="display: flex; justify-content: space-between; padding: 8px; margin: 0 -16px; background: ${COLORS.grayBg}; font-weight: bold;">
          <span style="color: ${COLORS.foreground}; font-size: 13px;">TOTAL</span>
          <span style="font-size: 20px; color: ${COLORS.foreground}; font-weight: bold;">${formatCurrency(finalTotal)}</span>
        </div>
        
        ${hasAdvance ? `
          <!-- Separator -->
          <div style="border-top: 1px dashed ${COLORS.border}; margin: 8px 0;"></div>
          
          <!-- Step 6: Advance Payment -->
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: ${COLORS.muted};">Less: Advance Received</span>
            <span style="color: ${COLORS.foreground}; font-weight: 600;">- ${formatCurrency(advanceAmount)}</span>
          </div>
          
          <!-- Separator -->
          <div style="border-top: 2px solid ${COLORS.foreground}; margin: 8px 0;"></div>
          
          <!-- Step 7: BALANCE DUE -->
          <div style="display: flex; justify-content: space-between; padding: 10px; margin: 0 -16px; background: ${COLORS.grayLight}; border-radius: 4px;">
            <span style="color: ${COLORS.foreground}; font-weight: bold; font-size: 13px;">BALANCE DUE</span>
            <span style="font-size: 22px; color: ${COLORS.foreground}; font-weight: bold;">${formatCurrency(balanceDue)}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function generateTotalLine(label: string, amount: number): string {
  return `
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: ${COLORS.muted};">${label}</span>
      <span style="color: ${COLORS.foreground}; font-weight: 500;">${formatCurrency(amount)}</span>
    </div>
  `;
}

function generateAmountInWords(amount: number, isBalanceDue: boolean = false): string {
  const bgColor = isBalanceDue ? COLORS.grayLight : COLORS.grayBg;
  const borderColor = COLORS.foreground;
  const textColor = COLORS.foreground;
  const label = isBalanceDue ? 'Balance Due in Words: ' : 'Amount in Words: ';

  return `
    <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 12px; border-radius: 4px; font-size: 12px; margin-bottom: 16px;">
      <p style="color: ${textColor}; margin: 0;">
        <span style="font-weight: 600;">${label}</span>
        <span style="font-weight: 500;">${numberToWords(amount)}</span>
      </p>
    </div>
  `;
}

function generatePaymentDetails(currentUser: User | undefined, qrCodeDataUrl: string | null): string {
  const hasBankDetails = currentUser?.businessDetails?.bankName ||
    currentUser?.businessDetails?.accountNumber ||
    currentUser?.businessDetails?.ifscCode;

  const hasUpiId = currentUser?.businessDetails?.upiId;

  // Don't render if no payment details
  if (!hasBankDetails && !hasUpiId) {
    return '';
  }

  return `
    <div style="border-top: 2px solid ${COLORS.foreground}; padding-top: 16px; margin-top: 16px;">
      <p style="font-weight: bold; color: ${COLORS.foreground}; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; margin: 0 0 12px 0;">
        Payment Details
      </p>
      <div style="display: grid; grid-template-columns: 1fr auto; align-items: start; gap: 32px;">
        <!-- Left Side: Bank Details -->
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
          ${currentUser?.businessDetails?.bankName ? generatePaymentLine('Bank Name', currentUser.businessDetails.bankName) : ''}
          ${currentUser?.businessDetails?.accountHolderName ? generatePaymentLine('Account Holder', currentUser.businessDetails.accountHolderName) : ''}
          ${currentUser?.businessDetails?.accountNumber ? generatePaymentLine('Account Number', currentUser.businessDetails.accountNumber, true) : ''}
          ${currentUser?.businessDetails?.ifscCode ? generatePaymentLine('IFSC Code', currentUser.businessDetails.ifscCode, true) : ''}
        </div>
        <!-- Right Side: UPI QR Code -->
        ${hasUpiId && qrCodeDataUrl ? `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 12px; color: ${COLORS.muted}; font-weight: 500; margin: 0 0 8px 0;">Scan to Pay</p>
            <div style="border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 8px; background: ${COLORS.white}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <img src="${qrCodeDataUrl}" alt="UPI Payment QR Code" style="width: 128px; height: 128px; display: block;" />
            </div>
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; color: ${COLORS.muted};">${currentUser?.businessDetails?.upiId}</span>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function generatePaymentLine(label: string, value: string, mono: boolean = false): string {
  return `
    <div style="display: flex; align-items: center;">
      <span style="color: ${COLORS.muted}; width: 110px; flex-shrink: 0;">${label}</span>
      <span style="color: ${COLORS.foreground}; font-weight: 600; ${mono ? 'font-family: monospace;' : ''}">${value}</span>
    </div>
  `;
}

function generateFooterNotice(currentUser: User | undefined): string {
  return `
    <div style="text-align: center; font-size: 11px; border-top: 1px solid ${COLORS.border}; padding-top: 12px; margin-top: 12px;">
      <p style="color: ${COLORS.muted}; font-weight: 500; margin: 0;">
        This invoice is electronically generated and does not require a physical signature.
      </p>
      <p style="color: ${COLORS.muted}; font-size: 10px; margin: 4px 0 0 0;">
        For inquiries, please contact ${currentUser?.businessDetails?.email || 'support'}
      </p>
    </div>
  `;
}
