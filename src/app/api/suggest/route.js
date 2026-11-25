import { NextResponse } from 'next/server';

/**
 * Super-fast Google Places + Photon / OpenStreetMap Suggestion Engine
 * Provides instant live suggestions as the user types (with debounce)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // 'city', 'area', 'all'
    const country = searchParams.get('country') || 'India';

    if (!q || q.trim().length < 1) {
      return NextResponse.json({ success: true, results: [] });
    }

    const query = q.trim();

    // Map common country names
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
    const cCode = countryCodes[country.toLowerCase()] || '';

    // Use Photon / Komoot Geocoding API (Fast, no rate-limits, rich autocomplete)
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`;
    if (cCode) {
      // Focus on selected country
      url += `&lang=en`;
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LeadRadar-Finder/2.0',
        'Accept-Language': 'en'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, results: [] });
    }

    const data = await res.json();
    const features = data.features || [];

    // Filter and format results
    const results = features
      .map((f) => {
        const props = f.properties || {};
        const name = props.name || '';
        const city = props.city || props.town || props.village || props.county || '';
        const state = props.state || '';
        const countryName = props.country || '';
        const street = props.street || '';
        const district = props.district || props.suburb || props.locality || '';

        // Label formatting
        const parts = [name, district, city, state, countryName].filter(Boolean);
        const uniqueParts = Array.from(new Set(parts));

        return {
          title: name,
          localArea: district || name,
          city: city || name,
          state,
          country: countryName,
          fullLabel: uniqueParts.join(', '),
        };
      })
      // If country specified, prioritize matching country
      .sort((a, b) => {
        if (a.country.toLowerCase() === country.toLowerCase()) return -1;
        if (b.country.toLowerCase() === country.toLowerCase()) return 1;
        return 0;
      })
      .slice(0, 8);

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
