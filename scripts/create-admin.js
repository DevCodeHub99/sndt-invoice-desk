#!/usr/bin/env node

/**
 * Admin User Creation/Update Script
 * Creates or updates the admin user with credentials
 * Run: node scripts/create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/invoicedesk';
const ADMIN_EMAIL = 'test@example.com';
const ADMIN_PASSWORD = 'Test@123';

// User Schema
const businessDetailsSchema = new mongoose.Schema({
  companyName: String,
  taxId: String,
  registrationNumber: String,
  municipalTradeCertificate: String,
  email: String,
  phones: [String],
  billingAddress: String,
  billingCity: String,
  billingState: String,
  billingZipCode: String,
  billingCountry: String,
  website: String,
  defaultTaxRate: { type: Number, default: 18 },
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  accountHolderName: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessDetails: businessDetailsSchema,
  isSetupComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

async function createOrUpdateAdmin() {
  try {
    console.log('\n🔐 Admin User Management');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📡 Connecting to: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    const adminData = {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      isSetupComplete: true,
      businessDetails: {
        companyName: 'InvoiceDesk Solutions Pvt Ltd',
        taxId: '27AABCT6789H6Z5',
        registrationNumber: 'UDYAM-MH-04-0057906',
        municipalTradeCertificate: 'MTC-MH-2024-123456',
        email: 'billing@invoicedesk.com',
        phones: ['+91 98765 43210', '+91 98765 43211'],
        billingAddress: '123 Business Tower, Andheri East',
        billingCity: 'Mumbai',
        billingState: 'Maharashtra',
        billingZipCode: '400069',
        billingCountry: 'India',
        website: 'https://invoicedesk.com',
        defaultTaxRate: 18,
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'InvoiceDesk Solutions Pvt Ltd',
      },
    };

    if (existingAdmin) {
      // Update existing admin
      await User.updateOne(
        { email: ADMIN_EMAIL },
        { $set: adminData }
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin
      await User.create({
        id: uuidv4(),
        ...adminData,
        createdAt: new Date(),
      });
      console.log('✅ Admin user created successfully');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   📧 Email: ${ADMIN_EMAIL}`);
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n🚀 You can now login at: http://localhost:3000/auth/login\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createOrUpdateAdmin();
