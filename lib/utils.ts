export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  const subtotal = Math.round((quantity * unitPrice) * 100) / 100;
  const tax = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
  return {
    subtotal,
    tax,
    total: Math.round((subtotal + tax) * 100) / 100,
  };
}

function convertToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  if (num === 0) return '';

  let words = '';
  let scaleIndex = 0;
  let n = num;

  while (n > 0) {
    let groupValue;
    if (scaleIndex === 0) {
      groupValue = n % 1000;
      n = Math.floor(n / 1000);
    } else if (scaleIndex === 1) { // Thousand
      groupValue = n % 100;
      n = Math.floor(n / 100);
    } else if (scaleIndex === 2) { // Lakh
      groupValue = n % 100;
      n = Math.floor(n / 100);
    } else { // Crore and above
      groupValue = n % 100;
      n = Math.floor(n / 100);
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

  return words.trim();
}

export function numberToWords(num: number): string {
  // Round to nearest 2 decimal places to fix floating point issues (e.g. 416552.999999 -> 416553.00)
  const roundedNum = Math.round(num * 100) / 100;

  if (roundedNum === 0) return 'Zero Rupees Only';

  const rupees = Math.floor(roundedNum);
  const paise = Math.round((roundedNum - rupees) * 100);

  let result = '';

  if (rupees > 0) {
    result += convertToWords(rupees) + ' Rupees';
  } else if (paise > 0) {
    result += 'Zero Rupees';
  }

  if (paise > 0) {
    result += ' and ' + convertToWords(paise) + ' Paise';
  }

  return result + ' Only';
}

export function calculateGST(subtotal: number, taxRate: number, isInterState: boolean = false) {
  const totalTax = Math.round((subtotal * (taxRate / 100)) * 100) / 100;

  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      total: totalTax,
    };
  }

  const halfTax = Math.round((totalTax / 2) * 100) / 100;
  return {
    cgst: halfTax,
    sgst: halfTax,
    igst: 0,
    total: Math.round((halfTax * 2) * 100) / 100,
  };
}

export function calculateRoundOff(total: number): number {
  return 0;
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getLastMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}
