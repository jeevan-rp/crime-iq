/**
 * Catalyst Push Notifications Adapter
 * 
 * When Catalyst is configured: uses Catalyst Push Notifications
 * When running locally: logs to console (no-op for actual push)
 * 
 * Usage:
 *   import { sendPushNotification } from '@/lib/catalyst/notifications'
 *   await sendPushNotification('Critical Alert', 'New murder case in Bengaluru Urban', { firId: '123' })
 */

import { catalystConfig } from './config'

export interface NotificationPayload {
  title: string
  message: string
  data?: Record<string, string | number>
  topic?: string
  priority?: 'high' | 'normal'
}

export interface SubscriptionResult {
  success: boolean
  topic: string
}

/** Send a push notification to subscribed devices */
export async function sendPushNotification(
  title: string,
  message: string,
  data?: Record<string, string | number>,
  topic?: string,
): Promise<boolean> {
  const payload: NotificationPayload = { title, message, data, topic, priority: 'high' }

  try {
    if (catalystConfig.isCatalyst) {
      const { ZCatalystApp } = await import('zoho-catalyst-sdk')
      const app = ZCatalystApp.getInstance()
      const push = app.push()

      await push.send({
        notification: {
          title,
          body: message,
          data,
        },
        ...(topic && { to: `/topics/${topic}` }),
      })

      console.log(`[Push] Sent: "${title}"${topic ? ` to topic: ${topic}` : ''}`)
      return true
    }
  } catch (error) {
    console.warn('[Push] Send failed:', error)
  }

  // Local fallback: log to console
  console.log(`[Push - LOCAL] 📢 ${title}: ${message}`, data || '')
  return true
}

/** Subscribe a device token to a topic */
export async function subscribeToTopic(token: string, topic: string): Promise<SubscriptionResult> {
  try {
    if (catalystConfig.isCatalyst) {
      const { ZCatalystApp } = await import('zoho-catalyst-sdk')
      const app = ZCatalystApp.getInstance()
      const push = app.push()
      await push.subscribeToTopic(token, topic)
      console.log(`[Push] Subscribed ${token.slice(0, 8)}... to topic: ${topic}`)
      return { success: true, topic }
    }
  } catch (error) {
    console.warn('[Push] Subscribe failed:', error)
  }

  console.log(`[Push - LOCAL] Subscribed to topic: ${topic}`)
  return { success: true, topic }
}

/** Send a critical crime alert notification */
export async function sendCrimeAlert(
  crimeType: string,
  district: string,
  severity: string,
  firNumber: string,
): Promise<boolean> {
  const isCritical = severity === 'Critical' || severity === 'High'
  return sendPushNotification(
    `${severity.toUpperCase()}: ${crimeType} Alert`,
    `${crimeType} reported in ${district} — FIR: ${firNumber}`,
    { crimeType, district, severity, firNumber },
    isCritical ? 'critical-alerts' : 'all-crime',
  )
}
