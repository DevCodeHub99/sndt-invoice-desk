#!/usr/bin/env node

/**
 * Generate Secure JWT Secrets
 * Run: npm run generate-secrets
 */

const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('\n🔐 Generated Secure JWT Secrets\n');
console.log('Copy these to your .env file:\n');
console.log('JWT_SECRET=' + generateSecret());
console.log('JWT_REFRESH_SECRET=' + generateSecret());
console.log('\n⚠️  IMPORTANT: Keep these secrets secure and never commit them to git!\n');
