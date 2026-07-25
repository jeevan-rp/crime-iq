# Vercel Deployment Guide — CRIME IQ

This guide details how to deploy the **CRIME IQ** Next.js application to **Vercel**.

## The Database Persistence Challenge on Vercel

Vercel hosts Next.js applications in a serverless environment. This introduces a challenge for the default local SQLite database:
> [!WARNING]
> **Vercel Serverless Functions have an ephemeral/read-only filesystem.** 
> If you deploy with the default local SQLite configuration (`file:./db/custom.db`), any database modifications (new FIRs, predictions, etc.) will be lost when the serverless function spins down (cold start), and data will not be shared across concurrent visitor requests.

To host CRIME IQ successfully on Vercel, choose one of the following two deployment architecture options:

---

## Option A: Vercel Frontend + Zoho Catalyst Backend (Recommended)

Keep the application logic on Vercel, but offload the database, cache, auth, and storage to your Zoho Catalyst project.

### Step 1: Prepare Zoho Catalyst
Ensure you have completed the console configuration described in [CATALYST_DEPLOYMENT.md](file:///d:/crime-iq/CATALYST_DEPLOYMENT.md) (creating the Data Store tables, Stratus folders, etc.).

### Step 2: Configure Vercel Environment Variables
Add these environment variables in your Vercel project dashboard settings under **Settings → Environment Variables**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `catalyst` | Tells the adapter to bypass SQLite and use Catalyst Data Store |
| `JWT_SECRET` | *Your secure random string* | Used for signing tokens if not using Zoho Accounts auth |
| `CATALYST_PROJECT_ID` | *Your Catalyst Project ID* | Found in Catalyst Project settings |
| `CATALYST_API_KEY` | *Your Catalyst API Key* | Found in Catalyst Project settings |
| `CATALYST_ACCESS_TOKEN` | *Your Catalyst Access Token* | Found in Catalyst Project settings |

---

## Option B: Vercel Frontend + External SQL Database (Supabase / Neon)

Use Vercel for hosting, but swap the local SQLite database for a hosted PostgreSQL/MySQL database while running the app in standalone mode.

### Step 1: Provision a Hosted Database
1. Create a free database instance on [Supabase](https://supabase.com/) or [Neon](https://neon.tech/).
2. Copy the connection string (e.g., `postgresql://user:password@host:port/dbname`).

### Step 2: Update database schema provider (If swapping to Postgres)
If you switch from SQLite to Postgres, update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql" // change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 3: Run migrations / push schema
Push your database schema to the newly hosted database:
```bash
# Set your temporary local environment variable to the remote DB connection string
export DATABASE_URL="postgresql://user:password@host:port/dbname"
npx prisma db push
npx prisma db seed
```

### Step 4: Configure Vercel Environment Variables
In your Vercel project dashboard, set:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | *Your remote PostgreSQL/MySQL connection string* |
| `JWT_SECRET` | *Your secure random string* |

---

## Step 5: Deploying to Vercel

### Option 1: Import via Vercel Dashboard (Easiest)
1. Push your project code to a GitHub, GitLab, or Bitbucket repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New → Project**.
3. Import your repository.
4. Keep the default Build and Output settings (Vercel automatically detects Next.js).
5. Paste the environment variables (from Option A or B above).
6. Click **Deploy**.

### Option 2: Deploy via Vercel CLI
1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. Link the repository and deploy:
   ```bash
   vercel
   ```
3. Follow the CLI prompts to log in, select your team, and setup the project.
4. Add environment variables through the CLI:
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   ```
5. Deploy to production:
   ```bash
   vercel --prod
   ```
