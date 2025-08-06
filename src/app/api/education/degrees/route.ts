import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { degrees } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allDegrees = await db
      .select()
      .from(degrees)
      .where(eq(degrees.isActive, true))
      .orderBy(degrees.level, degrees.name);

    return NextResponse.json({ degrees: allDegrees });
  } catch (error) {
    console.error('Error fetching degrees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch degrees' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, level } = await request.json();

    if (!name || !level) {
      return NextResponse.json(
        { error: 'Name and level are required' },
        { status: 400 }
      );
    }

    const newDegree = await db
      .insert(degrees)
      .values({ name, level })
      .returning();

    return NextResponse.json({ degree: newDegree[0] });
  } catch (error) {
    console.error('Error creating degree:', error);
    return NextResponse.json(
      { error: 'Failed to create degree' },
      { status: 500 }
    );
  }
}