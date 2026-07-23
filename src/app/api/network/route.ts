import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get all persons with their roles
    const allPersons = await db.person.findMany({
      include: {
        suspectOf: { include: { fir: { select: { firNumber: true } } } },
        victimOf: { include: { fir: { select: { firNumber: true } } } },
      },
    });

    // Determine primary role for each person
    const nodes = allPersons.map((person) => {
      const suspectCount = person.suspectOf.length;
      const victimCount = person.victimOf.length;

      let label: string;
      let group: string;
      if (suspectCount > 0 && victimCount > 0) {
        label = 'Suspect / Victim';
        group = 'both';
      } else if (suspectCount > 0) {
        label = 'Suspect';
        group = 'suspect';
      } else if (victimCount > 0) {
        label = 'Victim';
        group = 'victim';
      } else {
        label = 'Person';
        group = 'other';
      }

      return {
        id: person.id,
        name: person.name,
        label,
        group,
        age: person.age,
        address: person.address,
        phone: person.phone,
        suspectCount,
        victimCount,
      };
    });

    // Get all links
    const allLinks = await db.link.findMany({
      include: {
        source: { select: { name: true } },
        target: { select: { name: true } },
      },
    });

    const edges = allLinks.map((link) => ({
      source: link.sourceId,
      target: link.targetId,
      label: link.relation,
      weight: link.strength,
      sourceName: link.source.name,
      targetName: link.target.name,
    }));

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error('Network API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network data' },
      { status: 500 }
    );
  }
}
