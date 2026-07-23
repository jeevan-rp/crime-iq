import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // All FIRs with location data
    const firs = await db.fir.findMany({
      select: {
        id: true,
        firNumber: true,
        crimeType: true,
        severity: true,
        date: true,
        latitude: true,
        longitude: true,
        district: true,
        station: true,
        status: true,
      },
    });

    // All stations with location data
    const stations = await db.station.findMany({
      select: {
        id: true,
        name: true,
        district: true,
        latitude: true,
        longitude: true,
        officers: true,
      },
    });

    return NextResponse.json({ firs, stations });
  } catch (error) {
    console.error('Map API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}
