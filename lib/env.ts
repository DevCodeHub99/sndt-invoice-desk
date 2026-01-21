/**
 * Environment Variable Validation
 * Ensures all required environment variables are set
 */

interface EnvConfig {
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

function validateEnv(): EnvConfig {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Warn about default secrets in production
  if (process.env.NODE_ENV === 'production') {
    const defaultSecrets = [
      'your-secret-key',
      'your-refresh-secret',
      'change-in-production',
    ];
    
    const hasDefaultSecret = defaultSecrets.some(
      (secret) =>
        process.env.JWT_SECRET?.includes(secret) ||
        process.env.JWT_REFRESH_SECRET?.includes(secret)
    );

    if (hasDefaultSecret) {
      console.warn(
        '⚠️  WARNING: Using default JWT secrets in production! ' +
        'Run "npm run generate-secrets" to generate secure secrets.'
      );
    }
  }

  return {
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  };
}

// Validate on module load (server-side only)
export const env = typeof window === 'undefined' ? validateEnv() : ({} as EnvConfig);

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
