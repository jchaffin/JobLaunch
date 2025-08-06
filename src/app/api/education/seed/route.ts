import { NextResponse } from 'next/server';
import { seedEducationData } from '@/lib/seed-education';
import { fetchAndSeedInstitutions } from '@/lib/fetch-institutions';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'basic';
    const limit = parseInt(searchParams.get('limit') || '500');

    if (source === 'collegeboard') {
      // Fetch real institution data from College Scorecard API
      console.log('Fetching real institution data...');
      await fetchAndSeedInstitutions(limit);
      
      // Still seed degrees as they're not available from external APIs
      await seedEducationData();
      
      return NextResponse.json({ 
        message: `Education data seeded successfully with ${limit} real institutions from College Scorecard API`,
        source: 'collegeboard'
      });
    } else {
      // Use original seed data
      await seedEducationData();
      return NextResponse.json({ 
        message: 'Education data seeded successfully with basic data',
        source: 'basic'
      });
    }
  } catch (error) {
    console.error('Error seeding education data:', error);
    return NextResponse.json(
      { error: 'Failed to seed education data', details: error.message },
      { status: 500 }
    );
  }
}