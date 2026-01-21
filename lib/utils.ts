export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount).replace('₹', '₹ ');
}

// GSTIN State Code Mapping (First 2 digits) - Correct GST State Codes
const GSTIN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

export function getStateFromGSTIN(gstin?: string): string | null {
  if (!gstin || gstin.length < 2) return null;
  const stateCode = gstin.substring(0, 2);
  return GSTIN_STATE_CODES[stateCode] || null;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function calculateItemTotal(quantity: number, unitPrice: number, taxRate: number): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = quantity * unitPrice;
  const tax = subtotal * (taxRate / 100);
  return {
    subtotal,
    tax,
    total: subtotal + tax,
  };
}

export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  if (num === 0) return 'Zero';

  let words = '';
  let scaleIndex = 0;

  while (num > 0) {
    let groupValue = num % 1000;
    if (num >= 100000) {
      groupValue = num % 100;
      num = Math.floor(num / 100);
    } else {
      num = Math.floor(num / 1000);
    }

    if (groupValue > 0) {
      let groupWords = '';
      const hundreds = Math.floor(groupValue / 100);
      const remainder = groupValue % 100;

      if (hundreds > 0) {
        groupWords += ones[hundreds] + ' Hundred ';
      }

      if (remainder >= 20) {
        groupWords += tens[Math.floor(remainder / 10)];
        if (remainder % 10 > 0) {
          groupWords += ' ' + ones[remainder % 10];
        }
      } else if (remainder >= 10) {
        groupWords += teens[remainder - 10];
      } else if (remainder > 0) {
        groupWords += ones[remainder];
      }

      if (scaleIndex > 0 && groupWords) {
        groupWords += ' ' + scales[scaleIndex];
      }

      words = groupWords + ' ' + words;
    }

    scaleIndex++;
  }

  return words.trim() + ' Rupees Only';
}

export function calculateGST(subtotal: number, taxRate: number, isInterState: boolean = false) {
  const totalTax = subtotal * (taxRate / 100);
  
  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      total: totalTax,
    };
  }

  return {
    cgst: totalTax / 2,
    sgst: totalTax / 2,
    igst: 0,
    total: totalTax,
  };
}

export function calculateRoundOff(total: number): number {
  const rounded = Math.round(total);
  return rounded - total;
}
