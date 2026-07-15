# Evaluna ERP

**Evaluna ERP** is a proprietary, enterprise-grade Resource Planning and Inventory Management system. 

Built on modern web technologies, it features role-based dashboards, deeply integrated Brazilian fiscal compliance (SEFAZ), robust point-of-sale functionality, and real-time inventory management.

> **CONFIDENTIALITY NOTICE:** This repository and its contents are proprietary and confidential. Unauthorized copying, distribution, or use of this codebase is strictly prohibited.

---

## 🏗️ Architecture & Tech Stack

This project is structured as a **Turborepo** monorepo containing the main web application and shared internal packages.

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI & Styling:** React 19, Tailwind CSS v4, Radix UI (shadcn/ui)
- **API Layer:** tRPC v11 for end-to-end type safety
- **Database Engine:** PGLite (Local embedded PostgreSQL via WASM) 
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth
- **Package Manager:** Bun

## 🛡️ Role-Based Modules

The system is highly modularized, with isolated dashboard interfaces tailored to specific operational roles:

- **Admin / Manager:** Branch oversight, staff management, extensive reporting, and cashbook controls.
- **Auditor:** Inventory auditing, cycle counting, and discrepancy tracking.
- **Warehouse (Picker / Putter):** Stock placement, barcode scanning, order picking, and GRN receiving.
- **Biller / Point of Sale (POS):** High-speed checkout, barcode scanning, receipt printing, and customer tracking.
- **Sales Person:** Dispatch logic, delivery tracking, and external order management.

---

## 🚀 Quick Start (Local Development)

The codebase is designed to run locally with zero external dependencies using an embedded PGLite database.

### 1. Installation
Ensure you have [Bun](https://bun.sh/) installed.

```bash
# Clone the repository
git clone <repository_url>
cd evaluna-erp

# Install dependencies across all workspaces
bun install
```

### 2. Environment Configuration
Create your local environment file:

```bash
cp .env.local .env
```
Ensure you have a secure secret set for authentication in your `.env.local`:
```env
BETTER_AUTH_SECRET=your_secure_random_string
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Run the Development Server

```bash
bun run dev
```

The application will start at `http://localhost:3000`. 
*Note: On the first run, the system will automatically provision the local PGLite database, push the Drizzle schema, and seed demo data.*

---

## 📦 Project Structure

```text
Evaluna ERP/
├── apps/
│   └── web/                    # Main Next.js 16 Dashboard & POS Application
│       ├── src/app/            # App Router (Dashboards and API routes)
│       ├── src/components/     # Shared UI component library
│       ├── src/lib/db/         # Drizzle configuration and PGLite singleton
│       └── src/lib/trpc/       # tRPC backend routers
├── packages/
│   ├── db/                     # Global Database Schema and Migrations
│   ├── env/                    # Environment Variable Validation
│   └── fiscal/                 # Standalone Brazilian SEFAZ tax engine 
├── package.json
└── turbo.json                  # Monorepo build orchestration
```

---

## 🗄️ Database Strategy

### Development (PGLite)
By default, the system uses **PGLite**, which runs a full PostgreSQL database via WASM directly in the Node.js process. Data is stored safely on your filesystem. This allows developers to work without running Docker or connecting to an external cloud database.

### Production (PostgreSQL)
When deploying to production, simply provide a real database URL in your `.env.local`:
```env
DATABASE_URL=postgresql://user:password@host:5432/evaluna-erp
```
Because the system uses Drizzle ORM, migrating from PGLite to a cloud PostgreSQL provider (like Supabase, Neon, or AWS RDS) requires absolutely no schema or application code changes.

---

## 🧪 Testing & Linting

```bash
# Run the Biome formatter and linter
bun run check

# Verify TypeScript compilation (Strict Mode)
bun run check-types
```
