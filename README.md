# Thrift by Muskan

A boutique online thrift store with a curated, single-item-per-product inventory model. Customers browse and checkout anonymously — no accounts required. The editorial earth-tone storefront is paired with an iOS-inspired admin dashboard for managing products, orders, banners, and store settings.

---

## Features

- **Storefront** — filterable product grid, product detail modal, cart sidebar, 4-step checkout modal
- **Payments** — Razorpay integration with atomic product reservation, webhook fallback, and 10-minute reservation TTL
- **Admin dashboard** — product management with Cloudinary image uploads, order triage, banner management, store settings, team invites
- **Invoices** — on-demand PDF generation (no stored files, no Chromium)
- **Email** — buyer confirmation and admin order notification via Resend
- **Shipping** — Shiprocket integration triggered on payment capture

---

## Tech Stack

### Frontend (`client/`)
| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router 7 |
| Styling (storefront) | CSS Modules |
| Styling (admin) | Tailwind CSS v4 + Radix UI primitives |
| Forms (admin) | react-hook-form |
| Icons | lucide-react |
| Payments | Razorpay Checkout SDK |

### Backend (`server/`)
| Layer | Choice |
|---|---|
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT (RS256) + bcrypt |
| Scheduling | node-cron (reservation TTL) |
| Validation | Zod |
| PDF | pdfkit |
| Images | Cloudinary (client-side direct upload, server-signed) |
| Email | Resend |
| Payments | Razorpay Orders + Webhooks |
| Shipping | Shiprocket |

### Infrastructure
| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Image CDN | Cloudinary |

---

## Project Structure

```
thrift_by_muskan/
├── client/                         # React 19 + Vite SPA → Vercel
│   └── src/
│       ├── admin/                  # Self-contained admin dashboard
│       │   ├── admin.css           # Tailwind v4 entry + design tokens
│       │   ├── pages/              # Overview, Products, Orders, Banners, Settings, Team
│       │   └── components/         # DataTable, ImageUploader, Sidebar, Topbar, etc.
│       ├── components/             # Storefront components (Navbar, Cart, ProductModal, etc.)
│       ├── pages/                  # Home, About, AdminLogin
│       ├── services/api.js         # Axios instance (auto-injects JWT, handles 401)
│       └── styles/global.css       # Storefront base styles (scoped to .storefront-app)
│
├── server/                         # Express 5 API → Render
│   ├── controllers/                # Business logic
│   ├── models/                     # Mongoose models (Product, Order, Admin)
│   ├── routes/                     # Route definitions
│   ├── middleware/                 # verifyJWT, rateLimiter, validate, errorHandler
│   ├── schemas/                    # Zod validation schemas
│   ├── jobs/                       # releaseExpiredReservations (cron, every 5 min)
│   ├── services/                   # shiprocketService
│   ├── utils/                      # generateInvoice, sendEmails, razorpayVerify, invoiceLink
│   ├── scripts/                    # Dev utilities (not deployed)
│   │   ├── reset-data.js           # Clear orders, reset revenue (keep products)
│   │   ├── simulatePayment.js      # Test full payment flow locally
│   │   ├── sendWebhook.js          # Trigger Razorpay webhook locally
│   │   ├── smokeEmailTest.js       # Test Resend email integration
│   │   └── testInvoice.js          # Test PDF invoice generation
│   └── server.js                   # Entry point: DB connect, cron, bootstrap admin
│
└── Dockerfile                      # Server only (for self-hosting)
```

---

## Quick Start

### Server
```bash
cd server
npm install
# create server/.env — see Environment Variables below
npm run dev        # nodemon on http://localhost:5000
```

### Client
```bash
cd client
npm install
# create client/.env — see Environment Variables below
npm run dev        # Vite on http://localhost:5173
```

### Docker Compose (both together)
```bash
docker compose up --build
# Client → http://localhost:5173  (HMR enabled, src/ is volume-mounted)
# Server → http://localhost:5000
```

---

## Environment Variables

### Server (`server/.env`)

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=                       # min 32 chars, random string

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=              # never sent to client
RAZORPAY_WEBHOOK_SECRET=

# Cloudinary (server-side signing only — secret never sent to client)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=orders@yourdomain.com

# Notifications
ADMIN_EMAIL=                      # receives order notification emails
ADMIN_WHATSAPP=919876543210       # shown on PDF invoices (with country code)

# Deployment
CLIENT_URL=http://localhost:5173,https://your-app.vercel.app   # comma-separated CORS origins
PUBLIC_API_URL=https://your-api.onrender.com                   # used in invoice download links
PORT=5000
NODE_ENV=development

# Bootstrap (used once on first startup, remove afterwards)
INITIAL_ADMIN_EMAIL=
INITIAL_ADMIN_PASSWORD=
```

### Client (`client/.env`)

```env
VITE_API_URL=                     # your server URL + /api  (e.g. http://localhost:5000/api)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## Admin Setup

Set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` in `server/.env`, then start the server. It upserts the admin account on startup and logs `[Bootstrap] Initial admin synced`. Remove the vars after first run.

To invite additional admins, use the **Team** page in the dashboard (`/admin/team`).

---

## API Reference

Base URL: `http://localhost:5000` (dev) / `https://your-api.onrender.com` (prod)

All admin endpoints require `Authorization: Bearer <jwt>` unless marked **public**.

---

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | public | List available products. Query: `category`, `size`, `search`, `page`, `limit` |
| `GET` | `/api/products/:id` | public | Single product by ID |

---

### Payment

Rate limited: 10 requests / 15 min per IP.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/pay/create-order` | public | Atomically reserve product + create Razorpay order. Returns `razorpayOrderId`, `amount`, `currency` |
| `POST` | `/api/pay/verify` | public | Verify HMAC signature, mark order paid, mark product sold |
| `POST` | `/api/pay/cancel` | public | Release product reservation |

---

### Banners

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/banners` | public | Active banners for the storefront |
| `GET` | `/api/banners/admin` | admin JWT | All banners including inactive |
| `POST` | `/api/banners/admin` | admin JWT | Create banner |
| `POST` | `/api/banners/admin/reorder` | admin JWT | Bulk update `sortOrder` |
| `PATCH` | `/api/banners/admin/:id` | admin JWT | Update banner fields |
| `DELETE` | `/api/banners/admin/:id` | admin JWT | Delete banner |

---

### Settings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/settings` | public | Store name, categories, contact info, footer tagline |
| `PATCH` | `/api/settings/admin` | admin JWT | Update store settings |

---

### Admin — Auth

Rate limited: 5 attempts / 15 min on login and password endpoints.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/admin/login` | public | Email + password → JWT |
| `POST` | `/api/admin/forgot-password` | public | Send password reset email |
| `POST` | `/api/admin/reset-password` | public | Reset password using emailed token |
| `GET` | `/api/admin/invite/validate` | public | Validate an invite token before onboarding |
| `POST` | `/api/admin/onboard` | public | Complete registration via invite link |

---

### Admin — Team

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/admins` | admin JWT | List all admin accounts |
| `GET` | `/api/admin/invites` | admin JWT | List pending invites |
| `POST` | `/api/admin/invite` | admin JWT | Send an invite email |
| `DELETE` | `/api/admin/invites/:id` | admin JWT | Revoke a pending invite |

---

### Admin — Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/products` | admin JWT | All products including archived |
| `POST` | `/api/admin/products` | admin JWT | Create product |
| `PUT` | `/api/admin/products/:id` | admin JWT | Update product |
| `DELETE` | `/api/admin/products/:id` | admin JWT | Delete product |
| `PATCH` | `/api/admin/products/:id/status` | admin JWT | Toggle available / archived |
| `GET` | `/api/admin/cloudinary-signature` | admin JWT | Get signed params for direct Cloudinary upload |

---

### Admin — Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/orders` | admin JWT | List all orders. Query: `status`, `search`, `page` |
| `GET` | `/api/admin/orders/:id` | admin JWT | Order detail |
| `PUT` | `/api/admin/orders/:id` | admin JWT | Update order (AWB number, status override) |
| `POST` | `/api/admin/orders/:id/refund` | admin JWT | Initiate Razorpay refund |

---

### Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/analytics/overview` | admin JWT | KPIs, revenue chart data, orders-by-status, top categories |

---

### Invoice

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/orders/:id/invoice` | public (ID acts as token) | Stream PDF invoice for an order |

---

### Webhooks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/webhooks/razorpay` | HMAC signature | Razorpay `payment.captured` event handler. Marks order paid, marks product sold, triggers Shiprocket + confirmation emails |

---

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ ok: true }` — used by Render health checks |

---

## Rate Limits

| Endpoint group | Limit |
|---|---|
| `POST /api/admin/login` | 5 requests / 15 min per IP |
| `POST /api/admin/forgot-password` | 5 requests / 15 min per IP |
| `POST /api/admin/invite`, `POST /api/admin/onboard` | 5 requests / 15 min per IP |
| `POST /api/pay/*` | 10 requests / 15 min per IP |
| `GET /api/products`, `GET /api/banners`, `GET /api/settings` | 60 requests / min per IP |
| All other admin routes | 60 requests / min per IP |

---

## Deployment

### Backend → Render
- **Root directory:** `server`
- **Build command:** `npm install`
- **Start command:** `node server.js`
- Set all `server/.env` variables in the Render dashboard
- Set `CLIENT_URL` to your Vercel frontend URL

### Frontend → Vercel
- **Framework preset:** Vite
- **Root directory:** `client`
- **Output directory:** `dist`
- Set `VITE_API_URL` to your Render server URL
- Set `VITE_RAZORPAY_KEY_ID` to your live Razorpay key

### Self-hosting (server only)
```bash
docker build -t thrift-server .
docker run -p 5000:5000 --env-file server/.env thrift-server
```

> **Note:** Render's free tier sleeps after 15 min of inactivity. The first request after sleep takes ~30s to respond. The reservation cron job does not run while sleeping but resumes on the next request.

---

## Database Schema

MongoDB with Mongoose. All collections have `createdAt` / `updatedAt` timestamps unless noted.

---

### `products`

```
_id             ObjectId
name            String   required  maxlength 200
category        String   required  enum: tops | bottoms | dresses | accessories
salePrice       Number   required  min 0
originalPrice   Number             min 0  (optional — shown as strikethrough)
size            String   required  maxlength 20  (XS | S | M | L | XL | Free)
description     String             default ""  maxlength 2000
images          [String]           ordered Cloudinary URLs
thumbnailUrl    String             shown on product cards
status          String             enum: available | reserved | sold  default available
archived        Boolean            default false  (soft-delete)
reservedAt      Date               set on reservation, cleared on payment or TTL expiry
reservedOrderId String             Razorpay order ID that holds the reservation
tags            [String]

Indexes:
  { status, reservedAt }    — used by the TTL cron job every 5 min
  { category, status }      — storefront filter queries
  { archived, status }      — admin product list
```

**Status lifecycle:**
```
available ──reserve──► reserved ──payment verified──► sold
              │
              └──TTL (10 min, cron)──► available
```

---

### `orders`

```
_id                 ObjectId

# Legacy single-product fields (kept for backwards compat)
productId           ObjectId  ref: Product
productName         String
productImage        String
originalPrice       Number
salePrice           Number
size                String

# Multi-item support
items[]
  productId         ObjectId  ref: Product  required
  name              String    required
  image             String
  originalPrice     Number
  salePrice         Number    required
  size              String
  quantity          Number    min 1  default 1  (always 1 per business model)
  category          String

totalAmount         Number    min 0
currency            String    default "INR"

customer
  name              String    required  maxlength 200
  phone             String    required
  email             String

address
  line1             String    required  maxlength 300
  line2             String             maxlength 300
  city              String    required  maxlength 100
  state             String    required  maxlength 100
  pincode           String    required

razorpayOrderId     String
razorpayPaymentId   String
razorpaySignature   String

status              String    enum: pending | paid | failed | refunded  default pending
paidAt              Date

shipment
  shiprocketOrderId String
  shipmentId        String
  awbCode           String
  courierName       String
  trackingUrl       String
  status            String    default "pending"
  failedAt          Date
  error             String

Indexes:
  { razorpayOrderId }               — payment verify + webhook lookup
  { shipment.shiprocketOrderId }    — shipment tracking
  { status }
```

**Status lifecycle:**
```
pending ──payment verified──► paid
        ──payment failed───► failed
paid    ──admin action─────► refunded
```

---

### `admins`

```
_id                   ObjectId
email                 String  required  unique  lowercase
passwordHash          String  required  (bcrypt, 12 rounds)
resetPasswordToken    String            (hashed, set on forgot-password)
resetPasswordExpires  Date
```

---

### `admininvites`

```
_id         ObjectId
email       String              (optional — token-only invites allowed)
tokenHash   String  required  unique  (SHA-256 of the raw token sent in email)
createdBy   ObjectId  ref: Admin
expiresAt   Date      required  (48 h from creation)
used        Boolean   default false
```

---

### `banners`

```
_id        ObjectId
title      String  required  maxlength 200
subtitle   String            maxlength 500
ctaText    String            maxlength 100
ctaLink    String
imageUrl   String            Cloudinary URL
type       String  enum: hero_main | hero_secondary | promo  default hero_main
active     Boolean default true
sortOrder  Number  default 0

Indexes:
  { active, sortOrder }   — storefront query, sorted display order
```

> Only `hero_main` banners are consumed by the storefront (`HeroBanner` component). `hero_secondary` and `promo` types are reserved for future use.

---

### `storesettings`

Singleton document — always `_id: "singleton"`.

```
_id            String   "singleton"
storeName      String   default "Thrift by Muskan"
email          String
whatsapp       String   (shown on PDF invoices)
instagram      String
footerTagline  String   default "Made with care in Delhi."
categories     [String] default ["tops", "bottoms", "dresses", "accessories"]
               (drives storefront filter bar + admin product form)
```
