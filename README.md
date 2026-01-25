# InvoiceDesk - GST-Compliant Invoice Management System

A professional invoice management system built with Next.js 16, MongoDB, and TypeScript. Features comprehensive GST calculations, PDF generation, and multi-state tax handling.

## Features

- ✅ **GST-Compliant Invoicing** - Automatic CGST/SGST/IGST calculations
- ✅ **Multi-State Support** - Inter-state and intra-state transactions
- ✅ **PDF Generation** - Professional invoice PDFs with company branding
- ✅ **Product & Client Management** - Comprehensive CRUD operations
- ✅ **Labor Charges** - Separate manpower charges without GST
- ✅ **Invoice Archival** - Automatic archival with CSV/JSON export
- ✅ **User Isolation** - All data scoped to authenticated user
- ✅ **Rate Limiting** - API protection against abuse
- ✅ **Responsive Design** - Mobile-first UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **Authentication**: JWT with HTTP-only cookies
- **PDF Generation**: html2canvas + jsPDF

## Prerequisites

- Node.js 18+ 
- MongoDB 7+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-desk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run generate-secrets
   ```
   This creates a `.env` file with secure JWT secrets and MongoDB URI.

4. **Create admin user**
   ```bash
   npm run create-admin
   ```
   Creates/updates admin user with credentials:
   - Email: `test@example.com`
   - Password: `Test@123`

5. **Seed database (optional)**
   ```bash
   npm run seed
   ```
   Populates database with:
   - 50 products across multiple industries
   - 25 clients from different states
   - 38 invoices (current + archived)

6. **Start development server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── clients/         # Client CRUD
│   │   ├── invoices/        # Invoice CRUD + archival
│   │   ├── labor/           # Labor charges CRUD
│   │   ├── products/        # Product CRUD
│   │   └── user/            # User management
│   ├── auth/login/          # Login page
│   ├── clients/             # Client management UI
│   ├── invoices/            # Invoice management UI
│   ├── labor/               # Labor charges UI
│   ├── products/            # Product management UI
│   └── settings/            # Business settings UI
├── components/              # React components
│   ├── invoice/            # Invoice template
│   ├── layout/             # Layout components
│   └── ui/                 # Reusable UI components
├── lib/                     # Utilities and helpers
│   ├── models/             # Mongoose schemas
│   ├── api-helpers.ts      # API utilities
│   ├── auth.ts             # Authentication logic
│   ├── constants.ts        # App constants
│   ├── env.ts              # Environment validation
│   ├── invoice-retention.ts # Archival logic
│   ├── logger.ts           # Logging utility
│   ├── middleware.ts       # Auth middleware
│   ├── mongodb.ts          # Database connection
│   ├── pdf-generator.ts    # PDF generation
│   ├── rate-limit.ts       # Rate limiting
│   ├── store-mongodb.ts    # Zustand stores
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Helper functions
│   └── validation.ts       # Input validation
└── scripts/                 # Utility scripts
    ├── create-admin.js     # Admin user creation
    ├── generate-secrets.js # Environment setup
    └── seed.js             # Database seeding
```

## Key Features Explained

### GST Calculations

The system automatically determines whether to apply CGST+SGST (intra-state) or IGST (inter-state) based on the GSTIN state codes of your business and the client.

**Example:**
- Your business: Maharashtra (27)
- Client: Maharashtra (27) → CGST 9% + SGST 9%
- Client: Karnataka (29) → IGST 18%

### Invoice Archival

Invoices are automatically managed based on age:
- **Current Month**: Full access, editable
- **Last Month**: Read-only, downloadable as CSV/JSON
- **Older than 3 months**: Auto-deleted (configurable)

### Labor Charges

Separate section for manpower charges that don't include GST:
- Fixed rate or per-quantity pricing
- Custom unit descriptions (per brick, per bag, etc.)
- Integrated into invoice totals

### Rate Limiting

API endpoints are protected with rate limiting:
- Auth endpoints: 5 requests/15 minutes
- Regular endpoints: 100 requests/15 minutes

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Labor
- `GET /api/labor` - List all labor charges
- `POST /api/labor` - Create labor charge
- `PUT /api/labor/[id]` - Update labor charge
- `DELETE /api/labor/[id]` - Delete labor charge

### Invoices
- `GET /api/invoices` - List current month invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `GET /api/invoices/archive` - List archived invoices
- `GET /api/invoices/archive/download` - Download CSV
- `GET /api/invoices/archive/download-json` - Download JSON
- `POST /api/invoices/cleanup` - Manual cleanup old invoices

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/invoicedesk

# JWT Secrets (auto-generated)
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>

# Node Environment
NODE_ENV=development
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run generate-secrets` - Generate JWT secrets
- `npm run create-admin` - Create/update admin user
- `npm run seed` - Seed database with sample data

## Security Features

- JWT-based authentication with refresh tokens
- HTTP-only secure cookies
- Password hashing with bcrypt (10 rounds)
- Input sanitization and validation
- Rate limiting on all endpoints
- User isolation (all data scoped to user ID)
- CSRF protection via SameSite cookies

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Update `MONGODB_URI` to production database
3. Run `npm run build`
4. Run `npm start`
5. Set up reverse proxy (nginx/Apache)
6. Enable HTTPS
7. Configure firewall rules

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact: billing@invoicedesk.com
