import { NextRequest, NextResponse } from 'next/server'
import { sendCrimeAlert } from '@/lib/catalyst/notifications'
import { db } from '@/lib/db'

/**
 * POST /api/notifications/alert
 * 
 * Sends a push notification about a new or critical FIR.
 * On Catalyst: delivers via Catalyst Push Notifications.
 * Locally: logs to console.
 */
export async function POST(request: NextRequest) {
  try {
    const { firId } = await request.json()

    if (!firId) {
      return NextResponse.json({ error: 'firId is required' }, { status: 400 })
    }

    const fir = await db.fir.findUnique({ where: { id: firId } })
    if (!fir) {
      return NextResponse.json({ error: 'FIR not found' }, { status: 404 })
    }

    const sent = await sendCrimeAlert(
      fir.crimeType,
      fir.district,
      fir.severity,
      fir.firNumber,
    )

    return NextResponse.json({
      success: sent,
      message: sent
        ? `Alert sent for ${fir.firNumber} (${fir.severity} ${fir.crimeType})`
        : 'Failed to send alert',
    })
  } catch (error) {
    console.error('[Notifications] Alert error:', error)
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 })
  }
}
