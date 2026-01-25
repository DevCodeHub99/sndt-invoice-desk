import { Invoice, User } from './types';
import { formatCurrency, formatDate, numberToWords, getStateFromGSTIN } from './utils';

/**
 * Invoice PDF Generator
 * Generates a PDF from invoice data using html2canvas and jsPDF
 * Maintains consistent styling with the dashboard preview
 */

// Color constants matching the dashboard theme
const COLORS = {
  foreground: '#222831',
  muted: '#393E46',
  border: '#d1d1d1',
  black: '#000000',
  white: '#ffffff',
  grayBg: '#f3f4f6',
  grayAlt: 'rgba(229, 229, 229, 0.1)',
} as const;

export async function generateInvoicePDF(invoice: Invoice, currentUser: User | undefined) {
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).jsPDF;

  const container = createPDFContainer();
  container.innerHTML = generateInvoiceHTML(invoice, currentUser);
  
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
    addImageToPDF(pdf, canvas);

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

function createPDFContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  container.style.minHeight = '297mm'; // A4 height
  container.style.backgroundColor = COLORS.white;
  container.style.color = COLORS.foreground;
  container.style.padding = '0';
  return container;
}

function createPDFDocument() {
  return new (require('jspdf').jsPDF)({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
}

function addImageToPDF(pdf: any, canvas: HTMLCanvasElement) {
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pdfWidth - 10;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'JPEG', 5, 5, imgWidth, imgHeight);
}

function generateInvoiceHTML(invoice: Invoice, currentUser: User | undefined): string {
  const roundOff = Math.round(invoice.total) - invoice.total;
  const finalTotal = Math.round(invoice.total);

  return `
    <div style="font-family: Arial, sans-serif; color: ${COLORS.foreground}; background: ${COLORS.white}; padding: 0;">
      <div style="border: 1px solid ${COLORS.border}; border-radius: 8px; overflow: hidden;">
        ${generateHeader(invoice, currentUser)}
        <div style="padding: 32px;">
          ${generateBillingSection(invoice)}
          ${generateItemsTable(invoice)}
          ${generateTotalsSection(invoice, roundOff, finalTotal)}
          ${generateAmountInWords(finalTotal)}
          ${generatePaymentDetails(currentUser)}
          ${generateFooterNotice(currentUser)}
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
      subDescription: item.description,
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
                ${item.subDescription ? `<p style="font-size: 11px; color: ${COLORS.muted}; margin: 0;">${item.subDescription}</p>` : ''}
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
      <div style="font-size: 12px; border-left: 2px solid ${COLORS.black}; padding-left: 16px;">
        ${generateTotalLine('Subtotal', invoice.subtotal)}
        ${invoice.cgst > 0 ? generateTotalLine('CGST (9%)', invoice.cgst) : ''}
        ${invoice.sgst > 0 ? generateTotalLine('SGST (9%)', invoice.sgst) : ''}
        ${invoice.igst > 0 ? generateTotalLine('IGST (18%)', invoice.igst) : ''}
        ${roundOff !== 0 ? generateTotalLine('Round Off', roundOff) : ''}
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 2px solid ${COLORS.black}; font-weight: bold;">
          <span style="color: ${COLORS.foreground};">TOTAL</span>
          <span style="font-size: 18px; color: ${COLORS.foreground}; font-weight: bold;">${formatCurrency(finalTotal)}</span>
        </div>
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

function generateAmountInWords(amount: number): string {
  return `
    <div style="background: ${COLORS.grayBg}; border-left: 4px solid ${COLORS.black}; padding: 12px; border-radius: 4px; font-size: 12px; margin-bottom: 16px;">
      <p style="color: ${COLORS.foreground}; margin: 0;">
        <span style="font-weight: 600;">Amount in Words: </span>
        <span style="font-weight: 500;">${numberToWords(amount)}</span>
      </p>
    </div>
  `;
}

function generatePaymentDetails(currentUser: User | undefined): string {
  return `
    <div style="border-top: 2px solid ${COLORS.foreground}; padding-top: 16px; margin-top: 16px;">
      <p style="font-weight: bold; color: ${COLORS.foreground}; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; margin: 0 0 12px 0;">
        Payment Details
      </p>
      <div style="font-size: 12px; line-height: 1.8;">
        ${currentUser?.businessDetails?.bankName ? generatePaymentLine('Bank Name', currentUser.businessDetails.bankName) : ''}
        ${currentUser?.businessDetails?.accountHolderName ? generatePaymentLine('Account Holder', currentUser.businessDetails.accountHolderName) : ''}
        ${currentUser?.businessDetails?.accountNumber ? generatePaymentLine('Account Number', currentUser.businessDetails.accountNumber, true) : ''}
        ${currentUser?.businessDetails?.ifscCode ? generatePaymentLine('IFSC Code', currentUser.businessDetails.ifscCode, true) : ''}
      </div>
    </div>
  `;
}

function generatePaymentLine(label: string, value: string, mono: boolean = false): string {
  return `
    <div style="display: flex; justify-content: space-between;">
      <span style="color: ${COLORS.muted}; font-weight: 500;">${label}</span>
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
