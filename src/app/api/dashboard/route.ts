import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cachedFetch } from '@/lib/catalyst/cache';

const CACHE_KEY = 'dashboard_stats';
const CACHE_TTL = 120; // 2 minutes

export async function GET() {
  return cachedFetch(CACHE_KEY, fetchDashboardData, CACHE_TTL)
    .then(data => NextResponse.json(data))
    .catch(error => {
      console.error('Dashboard API error:', error);
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    });
}

async function fetchDashboardData() {
    // Total FIRs count
    const totalFirs = await db.fir.count();

    // Open FIRs count
    const openFirs = await db.fir.count({ where: { status: 'Open' } });

    // Closed FIRs count
    const closedFirs = await db.fir.count({ where: { status: 'Closed' } });

    // Crime counts by type
    const crimeByType = await db.fir.groupBy({
      by: ['crimeType'],
      _count: { crimeType: true },
      orderBy: { _count: { crimeType: 'desc' } },
    });

    // Crime counts by district
    const crimeByDistrict = await db.fir.groupBy({
      by: ['district'],
      _count: { district: true },
      orderBy: { _count: { district: 'desc' } },
    });

    // Monthly trend data (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrendRaw = await db.fir.groupBy({
      by: ['date'],
      where: { date: { gte: twelveMonthsAgo } },
      _count: { date: true },
    });

    // Aggregate by month
    const monthlyMap = new Map<string, number>();
    for (const item of monthlyTrendRaw) {
      const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + item._count.date);
    }

    // Fill in all months (including zeros)
    const monthlyTrend: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend.push({ month: key, count: monthlyMap.get(key) || 0 });
    }

    // Recent 10 FIRs with full details
    const recentFirs = await db.fir.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        suspects: { include: { person: true } },
        victims: { include: { person: true } },
      },
    });

    // Severity distribution
    const severityDist = await db.fir.groupBy({
      by: ['severity'],
      _count: { severity: true },
    });

    return {
      totalFirs,
      openFirs,
      closedFirs,
      underInvestigation: totalFirs - openFirs - closedFirs,
      crimeByType: crimeByType.map((c) => ({
        type: c.crimeType,
        count: c._count.crimeType,
      })),
      crimeByDistrict: crimeByDistrict.map((c) => ({
        district: c.district,
        count: c._count.district,
      })),
      monthlyTrend,
      recentFirs,
      severityDistribution: severityDist.map((s) => ({
        severity: s.severity,
        count: s._count.severity,
      })),
    };
}
