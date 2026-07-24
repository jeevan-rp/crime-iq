import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { catalystConfig } from '@/lib/catalyst/config'

/**
 * POST /api/reports
 * 
 * Generates a crime summary report.
 * On Catalyst: delegates to SmartBrowz for headless PDF generation.
 * Locally: returns JSON report data (PDF generation via browser print).
 */
export async function POST(request: NextRequest) {
  try {
    const { type, district, dateFrom, dateTo } = await request.json() || {}

    // Build query filters
    const where: Record<string, unknown> = {}
    if (district) where.district = district
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo)
    }

    const firs = await db.fir.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        suspects: { include: { person: true } },
        victims: { include: { person: true } },
      },
    })

    // Aggregate stats
    const byType = firs.reduce<Record<string, number>>((acc, f) => {
      acc[f.crimeType] = (acc[f.crimeType] || 0) + 1
      return acc
    }, {})

    const bySeverity = firs.reduce<Record<string, number>>((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1
      return acc
    }, {})

    const byStatus = firs.reduce<Record<string, number>>((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    }, {})

    const report = {
      generatedAt: new Date().toISOString(),
      type: type || 'summary',
      district: district || 'All Districts',
      period: { from: dateFrom || 'earliest', to: dateTo || 'latest' },
      totalFirs: firs.length,
      byCrimeType: byType,
      bySeverity,
      byStatus,
      firs: firs.map(f => ({
        firNumber: f.firNumber,
        date: f.date,
        district: f.district,
        station: f.station,
        crimeType: f.crimeType,
        severity: f.severity,
        status: f.status,
        description: f.description,
        suspects: f.suspects.map(s => s.person.name),
        victims: f.victims.map(v => v.person.name),
      })),
    }

    // On Catalyst, use SmartBrowz to generate actual PDF
    if (catalystConfig.isCatalyst) {
      try {
        const { ZCatalystApp } = await import('zoho-catalyst-sdk')
        const app = ZCatalystApp.getInstance()
        const smartbrowz = app.smartbrowz()
        
        // Generate PDF via SmartBrowz headless browser
        const pdfResult = await smartbrowz.render({
          url: `${catalystConfig.baseUrl}/report-pdf`,
          data: report,
          format: 'pdf',
        })
        
        return NextResponse.json({
          success: true,
          downloadUrl: pdfResult.url,
          report,
        })
      } catch (err) {
        console.warn('[SmartBrowz] PDF generation failed, returning JSON:', err)
      }
    }

    // Local: return JSON report (client can use window.print() for PDF)
    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('[Reports] Generation error:', error)
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
  }
}
