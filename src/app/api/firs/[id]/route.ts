import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const fir = await db.fir.findUnique({
      where: { id },
      include: {
        suspects: { include: { person: true } },
        victims: { include: { person: true } },
      },
    });

    if (!fir) {
      return NextResponse.json({ error: 'FIR not found' }, { status: 404 });
    }

    return NextResponse.json(fir);
  } catch (error) {
    console.error('FIR detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FIR details' },
      { status: 500 }
    );
  }
}
