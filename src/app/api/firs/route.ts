import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const district = searchParams.get('district') || '';
    const crimeType = searchParams.get('crimeType') || '';
    const status = searchParams.get('status') || '';
    const severity = searchParams.get('severity') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { firNumber: { contains: search } },
      ];
    }

    if (district) where.district = district;
    if (crimeType) where.crimeType = crimeType;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const total = await db.fir.count({ where });

    const firs = await db.fir.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        suspects: { include: { person: true } },
        victims: { include: { person: true } },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: firs,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('FIRs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FIRs' },
      { status: 500 }
    );
  }
}
