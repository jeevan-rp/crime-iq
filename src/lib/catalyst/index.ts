/**
 * CRIME IQ — Catalyst Integration Layer
 * 
 * Barrel export for all Catalyst services.
 * Each service gracefully falls back to a local implementation
 * when CATALYST_PROJECT_ID is not set.
 * 
 * Services mapping:
 * ─────────────────────────────────────────────────────────
 * │ Capability                    │ Catalyst Service Used    │
 * ├──────────────────────────────┼──────────────────────────┤
 * │ Serverless functions          │ Catalyst Serverless      │
 * │ Full web app runtime          │ Catalyst AppSail         │
 * │ Frontend / Next.js hosting    │ Catalyst Slate           │
 * │ Relational database           │ Catalyst Data Store      │
 * │ Cache                         │ Catalyst Cache           │
 * │ Full-text search              │ Catalyst Data Store      │
 * │ LLM / RAG                     │ Catalyst QuickML         │
 * │ User auth                     │ Catalyst Authentication  │
 * │ API routing + throttling      │ Catalyst API Gateway     │
 * │ Scheduled jobs                │ Catalyst Cron            │
 * │ Event-driven reactions        │ Catalyst Signals         │
 * │ Push notifications           │ Catalyst Push Notifs     │
 * │ File / blob storage           │ Catalyst Stratus         │
 * │ PDF report generation         │ Catalyst SmartBrowz      │
 * │ CI/CD                         │ Catalyst Pipelines       │
 * └──────────────────────────────┴──────────────────────────┘
 */

export { catalystConfig, getCatalystHeaders, logCatalystStatus } from './config'
export { cacheGet, cacheSet, cacheDelete, cacheClear, cachedFetch } from './cache'
export { getTable, fullTextSearch } from './datastore'
export type { QueryCondition, CatalystTable } from './datastore'
export { uploadFile, getDownloadUrl, deleteFile, listFiles } from './stratus'
export type { UploadedFile } from './stratus'
export { sendPushNotification, subscribeToTopic, sendCrimeAlert } from './notifications'
export type { NotificationPayload } from './notifications'
export { CATALYST_CRON_JOBS, getEnabledCronJobs, generateCronConfig } from './cron'
export type { CronJob } from './cron'
export { login, getCurrentUser, logout, hasRole, requireAuth, requireRole, getRoles, setAuthCookie } from './auth'
export type { CrimeIQUser, UserRole, AuthResult } from './auth'
