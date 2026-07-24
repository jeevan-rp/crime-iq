# CRIME IQ — AI Crime Intelligence Platform

> **Hackathon: Challenge 01** | Karnataka Police Intelligence Bureau  
> AI-powered crime intelligence with RAG, predictive analytics, network analysis, and explainable AI

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CRIME IQ FRONTEND                       │
│           Next.js 16 + TypeScript + Tailwind CSS            │
│    ┌──────────┬──────────┬──────────┬──────────┬───────────┐│
│    │Dashboard │ AI Chat  │Crime Map │ Network  │Prediction ││
│    │  (Recharts)│(RAG+LLM) │(Leaflet) │(Cytoscape)│ (XGBoost) ││
│    └──────────┴──────────┴──────────┴──────────┴───────────┘│
└──────────────────────────┬──────────────────────────────────┘
                           │ API Routes
┌──────────────────────────┴──────────────────────────────────┐
│               NEXT.JS API LAYER (Serverless)                 │
│  /api/dashboard  /api/chat  /api/firs  /api/map             │
│  /api/network    /api/predictions  /api/reports              │
│  /api/auth/*     /api/notifications/*                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────┬───────────────┼───────────────┬──────────────────┐
│ SQLite   │ Catalyst      │ z-ai-web-     │ Catalyst         │
│ (Prisma) │ Data Store    │ dev-sdk (LLM) │ QuickML (RAG)    │
│ LOCAL    │ CATALYST      │ AI Chat       │ CATALYST         │
└──────────┴───────────────┴───────────────┴──────────────────┘
```

## Features

| Feature | Description | Catalyst Service |
|---------|-------------|------------------|
| **Dashboard** | KPI cards, crime charts, trends, recent FIRs | Cache (2-min TTL) |
| **AI Chat** | RAG-powered crime intelligence assistant | QuickML (LLM/RAG) |
| **Crime Map** | Interactive Leaflet map with hotspot filters | — |
| **Network Analysis** | Cytoscape.js criminal relationship graphs | Data Store (graph) |
| **FIR Search** | Full-text search with multi-filter | Data Store (search) |
| **Predictive Analytics** | Risk scores, district analysis, explainable AI | QuickML / Cron |
| **Auth & Roles** | Login/logout with Admin/Officer/Investigator/Analyst | Authentication |
| **Push Alerts** | Real-time crime alerts by severity | Push Notifications |
| **PDF Reports** | Crime summary report generation | SmartBrowz |
| **File Storage** | Evidence files, exports | Stratus |
| **Cron Jobs** | Scheduled risk recalc, reports, cache refresh | Cron (Cloud Scale) |
| **API Gateway** | Rate limiting, throttling | API Gateway |

## Catalyst Services Used

| # | Capability | Catalyst Service | Status |
|---|-----------|-----------------|--------|
| 1 | Serverless backend | Catalyst Serverless (Functions) | Integrated |
| 3 | Full web app runtime | Catalyst AppSail (managed) | Ready |
| 4 | Frontend / Next.js hosting | Catalyst Slate | Ready |
| 6 | Relational database | Catalyst Data Store | Adapter ready |
| 8 | Object / blob storage | Catalyst Stratus | Integrated |
| 9 | Cache | Catalyst Cache | Integrated |
| 10 | Full-text search | Catalyst Data Store | Adapter ready |
| 11 | LLM / RAG | Catalyst QuickML | Adapter ready |
| 17 | User auth | Catalyst Authentication | Integrated |
| 18 | API routing + throttling | Catalyst API Gateway | Configured |
| 20 | Scheduled jobs | Catalyst Cron | Defined |
| 25 | Push notifications | Catalyst Push Notifications | Integrated |
| 16 | PDF report generation | Catalyst SmartBrowz | Integrated |
| 26 | CI/CD | Catalyst Pipelines | Config ready |

---

## Quick Start — Local Development

### Prerequisites

- **Node.js 22+** or **Bun 1.0+**
- **Git**
- A terminal

### Step 1: Clone & Install

```bash
git clone <your-repo-url> crime-iq
cd crime-iq

# Install dependencies
bun install
# or: npm install
```

### Step 2: Environment Setup

```bash
# Copy the example env file
cp .env.example .env
```

The defaults work out of the box for local development. The `.env` file contains:

```env
DATABASE_URL="file:./db/custom.db"
JWT_SECRET="crime-iq-local-dev-secret-key-2024"
# Catalyst vars are empty — app runs in local mode
```

### Step 3: Database Setup

```bash
# Generate Prisma client & push schema
bun run db:push

# Seed with 43 realistic FIRs, 17 persons, 23 links, 17 predictions
bun run seed
```

### Step 4: Start Development Server

```bash
bun run dev
```

The app will be available at **http://localhost:3000**.

### Step 5: Login (Local Demo)

Open the app and use these demo credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@kp.gov.in` | `Admin@123` |
| Officer | `officer@kp.gov.in` | `Officer@123` |
| Analyst | `analyst@kp.gov.in` | `Analyst@123` |
| Investigator | `investigator@kp.gov.in` | `Investigator@123` |

---

## Deployment on Zoho Catalyst

### Prerequisites

- Zoho Catalyst account (free tier available)
- Your project pushed to a Git repository

### Step 1: Create Catalyst Project

1. Go to [catalyst.zoho.com](https://catalyst.zoho.com)
2. Click **New Project** → Name it `CRIME-IQ`
3. Note your **Project ID** from project settings

### Step 2: Enable Required Services

In Catalyst Console, enable these services under your project:

| Service | Console Path | Action |
|---------|-------------|--------|
| **AppSail** | AppSail → Create | New managed runtime app |
| **Data Store** | Data Store → Tables | Create 7 tables (see below) |
| **Cache** | Cache | Enable (256MB) |
| **Authentication** | Authentication | Enable Zoho Accounts |
| **Stratus** | Stratus | Create folders: evidence, reports, exports |
| **Push** | Push Notifications | Enable |
| **Cron** | Cron | Create jobs (see cron config below) |
| **API Gateway** | API Gateway | Configure rate limits |
| **QuickML** | QuickML → LLM Serving | Deploy Gemini model |

### Step 3: Create Data Store Tables

Create these tables in Catalyst Data Store:

| Table | Columns |
|-------|----------|
| **FIRs** | id, firNumber, date, district, station, crimeType, description, status, severity, latitude, longitude, createdAt, updatedAt |
| **Persons** | id, name, age, address, phone, aadhaar |
| **Suspects** | id, firId (lookup FIRs), personId (lookup Persons) |
| **Victims** | id, firId (lookup FIRs), personId (lookup Persons) |
| **Links** | id, sourceId (lookup Persons), targetId (lookup Persons), relation, strength, createdAt |
| **Stations** | id, name, district, latitude, longitude, officers |
| **Predictions** | id, district, crimeType, riskScore, factors, month, createdAt |

Enable **Full-text Search** on: FIRs.description, FIRs.firNumber

### Step 4: Deploy via AppSail

**Option A: Git Integration (Recommended)**

1. Go to **AppSail → Create**
2. Select **Managed Runtime** → **Node.js 22**
3. Connect your Git repository
4. Set build settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Working Directory:** `/`
5. Set environment variables:
   - `DATABASE_URL` → leave empty (use Data Store)
   - `CATALYST_PROJECT_ID` → auto-injected
   - `CATALYST_API_KEY` → auto-injected
   - `CATALYST_ACCESS_TOKEN` → auto-injected
   - `JWT_SECRET` → generate a strong random string
6. Click **Deploy**

**Option B: CLI Deployment**

```bash
# Install Catalyst CLI globally
npm install -g @zoho/catalyst-cli

# Login
catalyst login

# Initialize in project
catalyst init

# Deploy
catalyst deploy
```

### Step 5: Set Up Cron Jobs

In Catalyst Console → **Cron**, create these jobs:

| Job | Schedule (IST) | Endpoint | Description |
|-----|---------------|----------|-------------|
| Daily Risk Recalc | 6:00 AM daily | `/api/cron/recalculate-risks` | Refresh prediction scores |
| Weekly Report | Monday 8:00 AM | `/api/cron/generate-weekly-report` | Generate PDF summary |
| Hourly Cache Refresh | Every hour | `/api/cron/refresh-cache` | Refresh dashboard cache |
| Entity Resolution | 6:30 AM daily | `/api/cron/entity-resolution` | Fuzzy match persons |

Or use the auto-generated config:

```bash
# This outputs the Catalyst cron config JSON
node -e "const {generateCronConfig}=require('./src/lib/catalyst/cron'); console.log(generateCatalystConfig())"
```

### Step 6: Configure Authentication

1. In **Authentication → Settings**, enable **Zoho Accounts**
2. Create 4 roles: `Admin`, `Officer`, `Investigator`, `Analyst`
3. Invite team members via email
4. Set role-based access in your API routes using `requireRole(request, 'Admin')`

### Step 7: Set Up API Gateway

1. In **API Gateway**, create a gateway for your AppSail app
2. Configure rate limiting:
   - 120 requests/minute
   - 20 burst
3. Add authentication middleware for protected routes

### Step 8: Set Up Push Notifications

1. In **Push Notifications**, enable the service
2. Create topics: `critical-alerts`, `all-crime`, `district-*`
3. Configure FCM/APNs credentials
4. The app automatically sends alerts for Critical/High severity FIRs

---

## Project Structure

```
crime-iq/
├── prisma/
│   ├── schema.prisma          # Database schema (SQLite)
│   └── seed.ts                # 43 FIRs, 17 persons, 23 links
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main SPA (view switcher)
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── globals.css        # Tailwind + custom styles
│   │   └── api/
│   │       ├── dashboard/route.ts    # Dashboard stats (cached)
│   │       ├── chat/route.ts         # AI RAG chat
│   │       ├── firs/route.ts         # FIR CRUD + search
│   │       ├── map/route.ts          # Map data
│   │       ├── network/route.ts      # Network graph data
│   │       ├── predictions/route.ts  # Risk predictions
│   │       ├── reports/route.ts      # PDF report generation
│   │       ├── auth/                  # Login/logout/me
│   │       └── notifications/         # Push alerts
│   ├── components/
│   │   ├── dashboard-view.tsx   # KPI cards + charts
│   │   ├── chat-view.tsx        # AI assistant
│   │   ├── map-view.tsx         # Leaflet crime map
│   │   ├── network-view.tsx     # Cytoscape.js graph
│   │   ├── search-view.tsx      # FIR search + filters
│   │   ├── predictions-view.tsx # Risk analytics
│   │   ├── app-sidebar.tsx      # Navigation sidebar
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts               # Prisma client
│   │   ├── utils.ts            # Utility functions
│   │   └── catalyst/            # ★ Catalyst integration layer
│   │       ├── config.ts       # Environment config
│   │       ├── cache.ts        # Cache adapter (Catalyst / in-memory)
│   │       ├── datastore.ts    # Data Store adapter
│   │       ├── stratus.ts      # File storage adapter
│   │       ├── notifications.ts # Push notifications
│   │       ├── cron.ts         # Scheduled job definitions
│   │       ├── auth.ts         # Auth adapter (Catalyst / JWT)
│   │       └── index.ts        # Barrel exports
│   ├── store/
│   │   └── use-app-store.ts    # Zustand state
│   └── hooks/                  # Custom React hooks
├── catalyst.config.json        # Catalyst project config
├── .env.example                # Environment template
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Charts | Recharts |
| Maps | Leaflet + react-leaflet |
| Graphs | Cytoscape.js + react-cytoscapejs |
| Database (local) | SQLite via Prisma ORM |
| Database (Catalyst) | Catalyst Data Store |
| AI Chat | z-ai-web-dev-sdk / Catalyst QuickML |
| State | Zustand + TanStack Query |
| Auth | jose (JWT) / Catalyst Authentication |
| Markdown | react-markdown |

## How the Catalyst Adapter Pattern Works

Every Catalyst service is wrapped in an adapter that:

1. **Checks** if `CATALYST_PROJECT_ID` is set in environment
2. **If yes**: calls the Catalyst SDK (zoho-catalyst-sdk)
3. **If no**: falls back to a local implementation
   - Cache → in-memory Map with TTL
   - Auth → JWT with demo users
   - Stratus → local filesystem (`public/uploads/`)
   - Data Store → null (use Prisma directly)
   - Push → console.log (no-op)

This means **the same codebase works both locally and on Catalyst** without any code changes.

## Troubleshooting

| Issue | Solution |
|-------|--------|
| `Error: Cannot find module 'jose'` | Run `bun install` — jose ships with Next.js |
| Port 3000 in use | Kill existing process: `lsof -ti:3000 \| xargs kill` |
| Blank page | Check `dev.log` for errors |
| Map not loading | Ensure `leaflet/dist/leaflet.css` is imported |
| Chat not responding | Check z-ai-web-dev-sdk is installed |
| Auth not working locally | Ensure `.env` has `JWT_SECRET` set |

## License

Karnataka Police Intelligence Bureau — Hackathon Submission

---

**Built with ❤️ for safer communities**
