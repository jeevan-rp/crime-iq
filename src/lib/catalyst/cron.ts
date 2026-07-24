/**
 * Catalyst Cron Job Definitions
 * 
 * These jobs are deployed to Catalyst Cron (Cloud Scale).
 * Locally they can be simulated with node-cron or a scheduler.
 * 
 * Deployment: Register these in your Catalyst project's function.config.json
 * or via Catalyst Console → Cron → Create Job.
 */

export interface CronJob {
  name: string
  /** Cron expression (UTC) */
  schedule: string
  /** API endpoint or function path to call */
  handler: string
  description: string
  enabled: boolean
  retryCount?: number
  timeoutMinutes?: number
}

/**
 * All scheduled jobs for CRIME IQ.
 * 
 * Zone: Asia/Calcutta (IST = UTC+5:30)
 * - 6:00 AM IST = 00:30 UTC
 * - 8:00 AM IST = 02:30 UTC
 * - Hourly = every hour
 */
export const CATALYST_CRON_JOBS: CronJob[] = [
  {
    name: 'daily-risk-recalculation',
    schedule: '30 0 * * *',       // 6:00 AM IST
    handler: '/api/cron/recalculate-risks',
    description: 'Recalculates crime risk scores for all districts based on latest FIR data',
    enabled: true,
    retryCount: 2,
    timeoutMinutes: 15,
  },
  {
    name: 'weekly-report-generation',
    schedule: '30 2 * * 1',       // Monday 8:00 AM IST
    handler: '/api/cron/generate-weekly-report',
    description: 'Generates a comprehensive weekly crime summary PDF report for all districts',
    enabled: true,
    retryCount: 1,
    timeoutMinutes: 30,
  },
  {
    name: 'hourly-cache-refresh',
    schedule: '0 * * * *',        // Every hour
    handler: '/api/cron/refresh-cache',
    description: 'Refreshes dashboard and stats cache to keep data near real-time',
    enabled: true,
    retryCount: 0,
    timeoutMinutes: 5,
  },
  {
    name: 'daily-entity-resolution',
    schedule: '0 1 * * *',        // 6:30 AM IST
    handler: '/api/cron/entity-resolution',
    description: 'Runs entity resolution to link same persons across different FIRs using fuzzy matching',
    enabled: true,
    retryCount: 1,
    timeoutMinutes: 20,
  },
  {
    name: 'nightly-network-rebuild',
    schedule: '0 3 * * *',        // 8:30 AM IST
    handler: '/api/cron/rebuild-network',
    description: 'Rebuilds criminal network graph relationships from latest FIR and person link data',
    enabled: false, // Expensive, run manually when needed
    retryCount: 1,
    timeoutMinutes: 30,
  },
]

/** Get only enabled cron jobs */
export function getEnabledCronJobs(): CronJob[] {
  return CATALYST_CRON_JOBS.filter(job => job.enabled)
}

/** Generate Catalyst function.config.json cron section */
export function generateCronConfig(): string {
  const jobs = getEnabledCronJobs().map(job => ({
    name: job.name,
    schedule: job.schedule,
    function: {
      target: job.handler,
    },
    retry_count: job.retryCount || 0,
    timeout: (job.timeoutMinutes || 5) * 60,
  }))
  return JSON.stringify({ cron_jobs: jobs }, null, 2)
}
