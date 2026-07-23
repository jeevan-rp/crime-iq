import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const predictions = await db.prediction.findMany({
      orderBy: { riskScore: 'desc' },
    });

    return NextResponse.json(predictions);
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
