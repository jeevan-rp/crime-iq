/**
 * Dynamic loader for Zoho Catalyst SDK
 * Prevents Next.js / Turbopack build errors when zoho-catalyst-sdk is not installed locally.
 */
export async function getCatalystSDK(): Promise<any> {
  try {
    const pkg = 'zoho-catalyst-sdk'
    return await import(pkg)
  } catch (err) {
    console.warn('[Catalyst SDK] zoho-catalyst-sdk module not available:', err)
    throw err
  }
}
