import { NextResponse } from 'next/server';

/**
 * Free & Unlimited Location Autocomplete using OpenStreetMap Nominatim
 * Returns full Country, State, City, Suburb, Town, Village, Postcode anywhere in the world!
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const country = searchParams.get('country');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    // Build Nominatim query with countrycode filter if provided
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=10`;
    
    if (country) {
      // Map common country names to ISO2
      const countryCodes = {
        'india': 'in',
        'united states': 'us',
        'usa': 'us',
        'united arab emirates': 'ae',
        'uae': 'ae',
        'united kingdom': 'gb',
        'uk': 'gb',
        'canada': 'ca',
        'australia': 'au',
        'germany': 'de',
        'singapore': 'sg',
        'saudi arabia': 'sa'
      };
      const code = countryCodes[country.toLowerCase().trim()];
      if (code) {
        url += `&countrycodes=${code}`;
      }
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LeadRadar-App/1.0 (contact: admin@leadradar.local)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, results: [] });
    }

    const data = await res.json();

    const formatted = data.map((item) => {
      const addr = item.address || {};
      const localArea = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.city_district || addr.road || '';
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || '';
      const state = addr.state || '';
      const countryName = addr.country || '';

      return {
        displayName: item.display_name,
        localArea,
        city: city || localArea,
        state,
        country: countryName,
        lat: item.lat,
        lon: item.lon,
      };
    });

    return NextResponse.json({ success: true, results: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
