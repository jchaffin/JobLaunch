import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions } from '@/lib/schema';
import { eq, isNull } from 'drizzle-orm';
import { enhanceInstitutionLocation } from '@/lib/google-maps';

export async function POST() {
  try {
    // Get institutions that don't have enhanced location data
    const institutionsToEnhance = await db
      .select()
      .from(institutions)
      .where(isNull(institutions.formatted_address))
      .limit(50); // Process in batches to avoid rate limits

    if (institutionsToEnhance.length === 0) {
      return NextResponse.json({ 
        message: 'All institutions already have enhanced location data',
        processed: 0 
      });
    }

    const results = [];
    let enhanced = 0;
    let failed = 0;

    for (const institution of institutionsToEnhance) {
      try {
        const locationData = await enhanceInstitutionLocation(
          institution.name, 
          institution.location || undefined
        );

        if (locationData) {
          await db
            .update(institutions)
            .set({
              formatted_address: locationData.formatted_address,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              city: locationData.city,
              state: locationData.state,
              country: locationData.country,
              place_id: locationData.place_id,
            })
            .where(eq(institutions.id, institution.id));

          enhanced++;
          results.push({
            id: institution.id,
            name: institution.name,
            status: 'enhanced',
            location: locationData.formatted_address
          });
        } else {
          failed++;
          results.push({
            id: institution.id,
            name: institution.name,
            status: 'failed',
            reason: 'Could not geocode location'
          });
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failed++;
        results.push({
          id: institution.id,
          name: institution.name,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Enhanced location data for ${enhanced} institutions`,
      enhanced,
      failed,
      total: institutionsToEnhance.length,
      results
    });

  } catch (error) {
    console.error('Error enhancing institution locations:', error);
    return NextResponse.json(
      { error: 'Failed to enhance institution locations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get summary of enhanced vs not enhanced institutions
    const allInstitutions = await db.select().from(institutions);
    const enhanced = allInstitutions.filter(inst => inst.formatted_address).length;
    const notEnhanced = allInstitutions.length - enhanced;

    return NextResponse.json({
      total: allInstitutions.length,
      enhanced,
      notEnhanced,
      enhancementProgress: `${enhanced}/${allInstitutions.length} (${Math.round((enhanced / allInstitutions.length) * 100)}%)`
    });

  } catch (error) {
    console.error('Error checking enhancement status:', error);
    return NextResponse.json(
      { error: 'Failed to check enhancement status' },
      { status: 500 }
    );
  }
}