/**
 * Application Constants
 * Centralized configuration values
 */

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  AUTH: {
    INTERVAL: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS_PROD: 5,
    MAX_REQUESTS_DEV: 100,
  },
  API: {
    INTERVAL: 60 * 1000, // 1 minute
    MAX_REQUESTS_PROD: 30,
    MAX_REQUESTS_DEV: 1000,
  },
  STRICT: {
    INTERVAL: 60 * 1000, // 1 minute
    MAX_REQUESTS_PROD: 5,
    MAX_REQUESTS_DEV: 100,
  },
} as const;

// Authentication
export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60, // 7 days in seconds
  SALT_ROUNDS: 10,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// Invoice
export const INVOICE = {
  RETENTION_MONTHS: 3,
  NUMBER_PREFIX: 'INV',
  NUMBER_PADDING: 4,
  STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
  } as const,
} as const;

// Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  GSTIN_REGEX: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PHONE_MIN_DIGITS: 10,
  PHONE_MAX_DIGITS: 15,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized - Please login again',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
} as const;
