# Zoho Catalyst Deployment Guide — CRIME IQ

This guide details the step-by-step instructions required to deploy the **CRIME IQ (AI Crime Intelligence Platform)** onto the **Zoho Catalyst** cloud platform.

CRIME IQ utilizes the **Catalyst Adapter Pattern** so that the same codebase runs seamlessly in both local environments (SQLite/in-memory) and production cloud environments (Catalyst Services) with zero code modifications.

---

## Architecture Overview on Catalyst

When deployed to Zoho Catalyst, the platform uses the following services:

| Local Resource | Catalyst Cloud Service | Role |
| :--- | :--- | :--- |
| Next.js Runtime | **AppSail (Node 22)** | Hosts the frontend and serverless API endpoints |
| SQLite Database | **Data Store** | Stores relational tables (FIRs, Persons, Suspects, etc.) |
| In-Memory Cache | **Cache** | Temporary storage with TTL to speed up dashboard queries |
| Local File Uploads | **Stratus** | Object storage for evidence, reports, and avatars |
| local JWT Auth | **Authentication** | Zoho Accounts integration for user auth with roles |
| Custom cron | **Cron** | Scheduled tasks (risk recalculation, reports, cache refresh) |
| Express routing | **API Gateway** | Rate limiting, endpoint security, and entry point routing |
| Console log / mock | **Push Notifications** | Sends real-time severity alerts to officers |
| local LLM / RAG | **QuickML** | Vector search and AI Chat with Gemini |

---

## Step 1: Install & Set Up Catalyst CLI

1. **Install the CLI globally**:
   ```bash
   npm install -g @zoho/catalyst-cli
   ```
2. **Log in to Catalyst**:
   Run the login command in your terminal:
   ```bash
   catalyst login
   ```
3. **Select Datacenter**:
   When prompted, choose the region corresponding to your Zoho account:
   - `US` — United States
   - `EU` — Europe
   - `IN` — India
   - `AU` — Australia
   - `CN` — China
   
   A browser window will open. Grant permission to finish logging in.

---

## Step 2: Initialize Project inside Workspace

1. In the project root directory, initialize the Catalyst configuration:
   ```bash
   catalyst init
   ```
2. **Select Services to initialize**:
   - Choose `AppSail` and `Cron` (and any other resources you want to manage via CLI).
3. **Select a Project**:
   - Choose an existing project or select `Create a New Project` and name it `CRIME-IQ`.
4. **AppSail configuration**:
   - Select **Node 22** as the runtime.
   - Set the build command to `npm install && npm run build`.
   - Set the start command to `npm start`.
   - Set the memory allocation to **512 MB** and CPU allocation to **0.5**.
   
This creates or updates `catalyst.json` and a configuration directory.

---

## Step 3: Configure Cloud Services in Catalyst Console

Log in to the [Zoho Catalyst Console](https://console.catalyst.zoho.com/) and configure the services.

### A. Data Store (Relational Database)

Under **Data Store**, create the following tables and schemas:

1. **`FIRs`**
   - Columns: `id`, `firNumber` (String), `date` (DateTime), `district` (String), `station` (String), `crimeType` (String), `description` (Text), `status` (String), `severity` (String), `latitude` (Double), `longitude` (Double), `createdAt` (DateTime), `updatedAt` (DateTime)
   - *Index*: Enable **Full-text Search** on `description` and `firNumber`.

2. **`Persons`**
   - Columns: `id`, `name` (String), `age` (Integer), `address` (String), `phone` (String), `aadhaar` (String)

3. **`Suspects`**
   - Columns: `id`, `firId` (Foreign Key -> FIRs), `personId` (Foreign Key -> Persons)

4. **`Victims`**
   - Columns: `id`, `firId` (Foreign Key -> FIRs), `personId` (Foreign Key -> Persons)

5. **`Links`**
   - Columns: `id`, `sourceId` (Foreign Key -> Persons), `targetId` (Foreign Key -> Persons), `relation` (String), `strength` (Double), `createdAt` (DateTime)

6. **`Stations`**
   - Columns: `id`, `name` (String), `district` (String), `latitude` (Double), `longitude` (Double), `officers` (Integer)

7. **`Predictions`**
   - Columns: `id`, `district` (String), `crimeType` (String), `riskScore` (Double), `factors` (Text/JSON), `month` (String), `createdAt` (DateTime)

---

### B. Stratus (File & Object Storage)

Go to **Stratus** and create the following folders:
- `evidence` (to store uploaded case evidence files)
- `reports` (for weekly/monthly generated PDF intelligence digests)
- `exports` (CSV/JSON network exports)
- `avatars` (user profiles)

---

### C. Cache

Go to **Cache** and ensure caching is enabled:
- Set maximum memory limit: **256 MB** (or 512 MB depending on availability).
- Default TTL is handled automatically by the adapter (2 minutes).

---

### D. Authentication

1. Go to **Authentication** and enable **Zoho Accounts** login provider.
2. In the Roles tab, define the following user roles exactly as named:
   - `Admin`
   - `Officer`
   - `Investigator`
   - `Analyst`
3. Configure the redirect URL to match your AppSail web app domain.

---

### E. Cron (Scheduled Tasks)

Go to **Cron** and create the following scheduled jobs to run the background tasks:

| Job Name | Schedule (UTC / IST) | Target API Endpoint / Function | Description |
| :--- | :--- | :--- | :--- |
| `daily-risk-recalculation` | `30 0 * * *` (06:00 AM IST) | `/api/cron/recalculate-risks` | Runs XGBoost and updates district risk predictions |
| `weekly-report-generation` | `30 2 * * 1` (Mon 08:00 AM IST) | `/api/cron/generate-weekly-report` | Triggers PDF summaries via SmartBrowz |
| `hourly-cache-refresh` | `0 * * * *` (Every Hour) | `/api/cron/refresh-cache` | Pre-warms cache for active dashboards |
| `daily-entity-resolution` | `0 1 * * *` (06:30 AM IST) | `/api/cron/entity-resolution` | Performs fuzzy person matching across FIRs |

---

### F. API Gateway

1. Set up an **API Gateway** proxy targeting your AppSail service.
2. Add rate limiting:
   - Request limit: **120 requests/minute**
   - Burst limit: **20 requests**

---

## Step 4: Configure AppSail Environment Variables

In the **AppSail Settings → Environment Variables** panel, set the following environment variables:

| Variable | Description |
| :--- | :--- |
| `CATALYST_PROJECT_ID` | *Auto-populated by Catalyst* |
| `CATALYST_API_KEY` | *Auto-populated by Catalyst* |
| `CATALYST_ACCESS_TOKEN`| *Auto-populated by Catalyst* |
| `JWT_SECRET` | Generate a cryptographically secure random string (e.g. `openssl rand -hex 32`) |
| `DATABASE_URL` | Set to `catalyst` (this signals the adapter layer to use the Catalyst Data Store) |

---

## Step 5: Build and Deploy

Run the deployment command:
```bash
catalyst deploy
```

The CLI will package the project, compile the Next.js assets into standalone format, upload them, and provide you with a live domain URL (e.g. `https://crime-iq.catalystserverless.in`).

### Checking Application Logs
If you encounter runtime errors on the deployed instance, fetch logs directly using:
```bash
catalyst logs --app app_sail
```

---

## Troubleshooting Guide

- **Database operations fail on deploy**: Ensure you have created the exact table names and case-sensitive column properties listed in Step 3A.
- **Unauthorized errors on API calls**: Check that `JWT_SECRET` is defined in the AppSail Environment Variables.
- **Cache misses**: Caching fallback works in memory if AppSail scales up. Ensure Catalyst Cache is explicitly enabled.
- **Static assets not loading**: Make sure the build script in `package.json` successfully copies static files (`cp -r .next/static .next/standalone/.next/` and `cp -r public .next/standalone/`).
