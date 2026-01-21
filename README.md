# InvoiceDesk - Professional GST Invoice & Billing Software

Professional GST-compliant invoice and billing management system for Indian businesses. Create invoices, manage clients, track payments, and handle GST calculations automatically.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **GST Invoices** | Create professional GST-compliant invoices with CGST/SGST/IGST |
| 📦 **Product Catalog** | Manage products/services with HSN/SAC codes |
| 🏢 **Client Management** | Store client details with GSTIN validation |
| 💰 **Payment Tracking** | Track invoice status (Pending/Paid) |
| 📊 **Dashboard** | Real-time revenue and invoice statistics |
| 📥 **PDF Export** | Download professional PDF invoices |
| ⚙️ **Business Settings** | Configure company details, bank info, tax rates |
| 🔍 **Smart Search** | Searchable dropdowns for large client/product lists |
| 🔐 **Secure Auth** | JWT-based authentication with 7-day sessions |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd invoice-desk

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Generate JWT secrets
npm run generate-secrets

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`

**Default Admin Credentials:**
- Email: `admin@invoicedesk.com`
- Password: `admin123`

## 📋 Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/invoicedesk

# JWT Secrets (generate using: npm run generate-secrets)
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Environment
NODE_ENV=development

# App URL (for SEO)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Installation and configuration
- [Features](docs/FEATURES.md) - Complete feature list
- [MongoDB Setup](docs/MONGODB.md) - Database configuration
- [Authentication](docs/AUTHENTICATION.md) - Auth system details
- [Security](docs/SECURITY.md) - Security implementation
- [Deployment](docs/DEPLOYMENT.md) - Production deployment guide
- [Invoice System](docs/INVOICE_SYSTEM.md) - Invoice architecture
- [Retention Policy](docs/RETENTION_POLICY.md) - Data retention rules
- [Optimization](docs/OPTIMIZATION.md) - Performance optimizations

## 🛠️ Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run seed             # Seed database with sample data
npm run update-hsn       # Update invoices with HSN/SAC codes
npm run cleanup-invoices # Clean up old invoices (3+ months)
npm run generate-secrets # Generate JWT secrets
```## 📦 Tech Stack

- **Framework**: Next.js 16.1
- **Language**: TypeScript 5
- **Database**: MongoDB 7.0 with Mongoose
- **Authentication**: JWT with HTTP-only cookies
- **Styling**: Tailwind CSS 4
- **PDF Generation**: html2canvas + jsPDF
- **State Management**: Zustand
- **Icons**: Lucide React

## 🏗️ Project Structure

```
invoice-desk/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── invoices/          # Invoice pages
│   ├── clients/           # Client pages
│   ├── products/          # Product pages
│   └── settings/          # Settings page
├── components/            # React components
│   ├── invoice/          # Invoice components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                   # Utilities and libraries
│   ├── models/           # MongoDB models
│   ├── auth.ts           # Authentication logic
│   ├── mongodb.ts        # Database connection
│   └── utils.ts          # Utility functions
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── public/               # Static assets
```

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- HTTP-only secure cookies
- bcrypt password hashing
- Rate limiting on auth endpoints
- CSRF protection
- XSS protection
- Security headers (HSTS, CSP, etc.)
- Input validation and sanitization

## ♿ Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader compatible
- Skip navigation link
- Focus indicators
- Semantic HTML

## 🎨 Performance

- Optimized bundle size (3.7MB)
- Image optimization (WebP, AVIF)
- Code splitting
- Lazy loading
- Compression enabled
- Lighthouse score: 95+

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
1. Check the [documentation](docs/)
2. Search existing issues
3. Create a new issue with details

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database
- All open-source contributors

---

Made with ❤️ for Indian businesses
