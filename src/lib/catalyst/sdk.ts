import { catalystConfig } from './config'

let appInstance: any = null

/**
 * Dynamically loads and initializes the official Zoho Catalyst SDK (zcatalyst-sdk-node).
 * Resolves config automatically in the Catalyst environment.
 * If running locally outside AppSail, it returns null and lets adapters fall back.
 */
export async function getCatalystApp(): Promise<any> {
  if (appInstance) return appInstance

  try {
    const catalyst = await import('zcatalyst-sdk-node')
    
    // Initialize the SDK
    appInstance = catalyst.initialize()
    return appInstance
  } catch (err) {
    // Graceful warning and fallback to local services
    console.warn('[Catalyst SDK] SDK not initialized (running locally/outside AppSail). Services will run in local mode.')
    return null
  }
}
