/**
 * Input Validation & Sanitization
 * Centralized validation logic with consistent error handling
 */

import { VALIDATION } from './constants';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Recursively sanitize any input
 */
export function sanitize(input: any): any {
  if (typeof input === 'string') return sanitizeString(input);
  if (Array.isArray(input)) return input.map(sanitize);
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitize(input[key]);
    }
    return sanitized;
  }
  return input;
}

// ============================================================================
// VALIDATORS
// ============================================================================

export function validateEmail(email: string): boolean {
  return VALIDATION.EMAIL_REGEX.test(email);
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

export function validateGSTIN(gstin: string): boolean {
  return VALIDATION.GSTIN_REGEX.test(gstin);
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= VALIDATION.PHONE_MIN_DIGITS && digits.length <= VALIDATION.PHONE_MAX_DIGITS;
}

export function validatePositiveNumber(value: any): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

export function validateDate(date: any): boolean {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

// ============================================================================
// REQUIRED FIELDS VALIDATION
// ============================================================================

export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): { valid: boolean; missing?: string[] } {
  const missing = fields.filter(field => !data[field] && data[field] !== 0);
  return missing.length > 0 
    ? { valid: false, missing: missing.map(String) }
    : { valid: true };
}

// ============================================================================
// INVOICE VALIDATION
// ============================================================================

export function validateInvoiceItems(items: any[]): ValidationResult {
  const errors: string[] = [];
  
  if (!Array.isArray(items)) {
    return { valid: false, errors: ['Items must be an array'] };
  }
  
  if (items.length === 0) {
    return { valid: false, errors: ['Invoice must have at least one item'] };
  }
  
  items.forEach((item, index) => {
    if (!item.productId) errors.push(`Item ${index + 1}: Missing productId`);
    if (!item.productName) errors.push(`Item ${index + 1}: Missing productName`);
    if (!item.description) errors.push(`Item ${index + 1}: Missing description`);
    if (!validatePositiveNumber(item.quantity)) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    }
    if (!validatePositiveNumber(item.unitPrice)) {
      errors.push(`Item ${index + 1}: Invalid unit price`);
    }
    if (!validatePositiveNumber(item.taxRate)) {
      errors.push(`Item ${index + 1}: Invalid tax rate`);
    }
  });
  
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}
