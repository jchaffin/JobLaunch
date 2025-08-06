import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allInstitutions = await db
      .select()
      .from(institutions)
      .where(eq(institutions.isActive, true))
      .orderBy(institutions.type, institutions.name);

    return NextResponse.json({ institutions: allInstitutions });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, type, location } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const newInstitution = await db
      .insert(institutions)
      .values({ name, type, location })
      .returning();

    return NextResponse.json({ institution: newInstitution[0] });
  } catch (error) {
    console.error('Error creating institution:', error);
    return NextResponse.json(
      { error: 'Failed to create institution' },
      { status: 500 }
    );
  }
}