/**
 * Catalyst Configuration
 * 
 * Reads environment variables and provides a centralized config object.
 * Set CATALYST_PROJECT_ID to enable Catalyst cloud services.
 * When not set, all services fall back to local implementations.
 * 
 * Required env vars for Catalyst:
 * - CATALYST_PROJECT_ID
 * - CATALYST_API_KEY
 * - CATALYST_ACCESS_TOKEN
 * 
 * Optional:
 * - CATALYST_ENVIRONMENT (default: Development)
 * - CATALYST_PROJECT_NAME
 */

export interface CatalystConfig {
  projectId: string
  projectName: string
  environment: string
  apiKey: string
  accessToken: string
  isCatalyst: boolean
  baseUrl: string
}

const config: CatalystConfig = {
  projectId: process.env.CATALYST_PROJECT_ID || '',
  projectName: process.env.CATALYST_PROJECT_NAME || 'CRIME-IQ',
  environment: process.env.CATALYST_ENVIRONMENT || 'Development',
  apiKey: process.env.CATALYST_API_KEY || '',
  accessToken: process.env.CATALYST_ACCESS_TOKEN || '',
  isCatalyst: !!process.env.CATALYST_PROJECT_ID,
  baseUrl: 'https://api.catalyst.zoho.com',
}

export const catalystConfig = config

/** Get authentication headers for Catalyst API calls */
export function getCatalystHeaders(): Record<string, string> {
  if (!config.isCatalyst) return {}
  return {
    'Authorization': `Zoho-oauthtoken ${config.accessToken}`,
    'X-CATALYST-PROJECT-ID': config.projectId,
    'Content-Type': 'application/json',
  }
}

/** Log Catalyst status on startup */
export function logCatalystStatus() {
  if (config.isCatalyst) {
    console.log(`[Catalyst] Connected to project: ${config.projectName} (${config.projectId}) [${config.environment}]`)
  } else {
    console.log('[Catalyst] Running in LOCAL mode — using SQLite + in-memory services')
  }
}

export default catalystConfig
