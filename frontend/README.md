# Snip — URL Shortener Frontend

A modern, high-performance URL shortener frontend built with **Next.js (App Router)**, **Tailwind CSS**, and a **shadcn/ui-inspired** modular component architecture. Designed in a sleek, minimalist dark theme with strict type safety and zero deployment issues.

---

## 🛠️ Architecture & Backend Alignment

This frontend connects directly to the FastAPI backend (`backend/app`):

| Backend Endpoint | Method | Frontend Proxy Route | Purpose |
| :--- | :--- | :--- | :--- |
| `/auth/signup` | `POST` | `/api/auth/signup` | Register new user + forward `access_token` cookie |
| `/auth/login` | `POST` | `/api/auth/login` | Authenticate user + forward `access_token` cookie |
| `/auth` (logout) | `POST` | `/api/auth/logout` | Clear `access_token` cookie session |
| `/url` | `POST` | `/api/url` | Create short link with `Idempotency-Key` |
| `/url` | `GET` | `/api/url` | List user links with pagination and search/status filter |
| `/url/{id}` | `PATCH` | `/api/url/[id]` | Update link configuration (active, max clicks, expiry) |
| `/url/{code}` | `GET` | Direct FastAPI 302 | Fast redirect via Redis cache |
| `/health-status` | `GET` | `/api/health` | Live backend connectivity status indicator |

---

## 📁 Modular Directory Structure

```
frontend/
├── app/
│   ├── api/                     # Next.js Route Handlers (proxying to FastAPI)
│   │   ├── auth/                # Login, Signup, Logout, Me session verification
│   │   ├── url/                 # Create, List, and Patch URL configurations
│   │   └── health/              # Health check status
│   ├── dashboard/page.tsx       # Authenticated link dashboard & analytics
│   ├── page.tsx                 # High-converting landing page with inline shortener
│   ├── layout.tsx               # Root layout with AuthProvider & dark theme
│   └── globals.css              # Custom Tailwind CSS v4 dark color variables
├── components/
│   ├── ui/                      # Reusable shadcn/ui primitives
│   │   ├── button.tsx           # Button with variants and loading state
│   │   ├── input.tsx            # Form input
│   │   ├── label.tsx            # Form label
│   │   ├── card.tsx             # Card containers
│   │   ├── badge.tsx            # Status pills (Active, Expired, Paused)
│   │   ├── dialog.tsx           # Accessible modal dialog
│   │   ├── switch.tsx           # Boolean toggle switch
│   │   └── tabs.tsx             # Tab triggers and containers
│   ├── auth/                    # Authentication components
│   │   ├── auth-modal.tsx       # Tabbed modal (Sign In / Register)
│   │   ├── login-form.tsx       # Login form with validation
│   │   └── signup-form.tsx      # Signup form (min 8 char password check)
│   ├── url/                     # URL management components
│   │   ├── url-shortener-card.tsx # Shortener with expandable advanced settings
│   │   ├── url-result-card.tsx  # Result display with copy and QR triggers
│   │   ├── url-list-table.tsx   # Dashboard table with click metrics & actions
│   │   ├── url-edit-dialog.tsx  # Edit link (status, click caps, expiry)
│   │   ├── url-qr-dialog.tsx    # High-res QR code view & PNG download
│   │   └── url-filter-bar.tsx   # Search by alias & filter by status
│   ├── layout/                  # Navigation & layout
│   │   ├── navbar.tsx           # Header with live API status & user dropdown
│   │   └── footer.tsx           # Minimal dark footer with architecture links
│   └── landing/                 # Landing page sections
│       ├── hero-section.tsx     # Hero headline + shortener
│       ├── features-grid.tsx    # Redis caching, expiry, click caps, QR codes
│       ├── how-it-works.tsx     # 3-step technical explanation
│       ├── stats-counter.tsx    # Low latency performance metrics
│       └── cta-section.tsx      # Registration call-to-action
├── context/
│   └── auth-context.tsx         # User authentication state provider
└── lib/
    ├── utils.ts                 # Classname merge (clsx + twMerge), date formatting
    ├── types.ts                 # Strict TypeScript types matching FastAPI schemas
    └── api-client.ts            # Type-safe client-side fetch wrapper
```

---

## 🎨 Design System

- **Clean Dark Theme**: Neutral zinc and slate tones (`#09090b` background, `#121215` cards, `#27272a` borders).
- **No Neon Colors**: Zero AI-style cyan/magenta glowing gradients; clean, high-contrast, professional typography.
- **Micro-Interactions**: Smooth transitions, loading spinners, instant copy clipboard feedback, and scannable QR code generation.

---

## 🚀 Running the App

### 1. Start the FastAPI Backend:
```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn app.main.py:app --reload
```
Runs at `http://127.0.0.1:8000`.

### 2. Start the Next.js Frontend:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

To build for production:
```bash
npm run build
npm run start
```
