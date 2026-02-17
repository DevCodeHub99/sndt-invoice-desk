# InvoiceDesk - GST-Compliant Invoice Management System

A professional, modern invoice management system built with **Next.js 16**, **MongoDB**, and **TypeScript**. Designed for small businesses to manage clients, products, and GST-compliant invoicing with ease.

## 🚀 Features

- ✅ **GST-Compliant Invoicing** - Automatic CGST/SGST/IGST calculations based on state codes.
- ✅ **UPI QR Code Integration** - Generate scannable UPI QR codes on invoices for instant payments.
- ✅ **Product & Client Management** - Full CRUD operations with industry-standard patterns.
- ✅ **Labor & Manpower Charges** - Dedicated support for service-based charges without GST.
- ✅ **User Isolation & Security** - All data is strictly scoped to the authenticated user.
- ✅ **Modern UI/UX** - Built with Tailwind CSS 4, featuring a responsive design and dark mode.
- ✅ **Password Security** - Includes a show/hide password toggle for secure login.
- ✅ **Print-Ready Invoices** - Pixel-perfect invoice templates optimized for browser printing.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes (Edge-ready), MongoDB with Mongoose
- **State Management**: Zustand 5
- **Styling**: Tailwind CSS 4 (Vanilla CSS philosophy)
- **Authentication**: JWT with secure HTTP-only cookies
- **Icons**: Lucide React

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **MongoDB**: 7.x or higher
- **npm**: 10.x or higher

## 📥 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sndt-invoice-desk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following:
   ```env
   MONGODB_URI=mongodb://localhost:27017/invoicedesk
   JWT_SECRET=your-secure-jwt-secret
   JWT_REFRESH_SECRET=your-secure-refresh-secret
   NODE_ENV=development
   ```

4. **Create Admin User**
   Run the utility script to create your first administrative account:
   ```bash
   npm run create-admin
   ```
   *Default credentials (if configured in script):*
   - **Email**: `test@example.com`
   - **Password**: `Test@123`

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to start managing your invoices.

## 📁 Project Structure

```text
├── app/                  # Next.js App Router
│   ├── api/              # Secure API endpoints
│   ├── auth/             # Authentication pages (Login)
│   ├── clients/          # Client management
│   ├── invoices/         # Invoice creation & viewing
│   ├── products/         # Inventory/Product management
│   └── settings/         # Business & Profile settings
├── components/           # React Components
│   ├── invoice/          # Print-optimized invoice templates
│   ├── layout/           # Shared layout components
│   └── ui/               # Reusable UI primitives (Input, Button, etc.)
├── lib/                  # Core Business Logic
│   ├── models/           # Mongoose schemas & types
│   ├── stores/           # Zustand state management
│   ├── auth.ts           # Authentication helpers
│   ├── qr-generator.ts   # UPI QR generation logic
│   └── utils.ts          # Utility functions
└── scripts/              # Maintenance & Setup scripts
```

## 🔐 Security Features

- **JWT Auth**: Double-token system (Access + Refresh) for enhanced security.
- **Cookie Security**: Tokens stored in `HttpOnly`, `Secure`, and `SameSite=Lax` cookies.
- **Bcrypt Hashing**: Industry-standard password encryption.
- **Input Validation**: Strict schema validation using **Zod**.
- **User Isolation**: Middleware ensures users can only access their own data.

## 📄 License

Proprietary - All rights reserved.

---
Built with ❤️ for professional billing.
