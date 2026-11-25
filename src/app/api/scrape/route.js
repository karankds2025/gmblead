import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { scrapeGoogleMaps } from '@/lib/scraper';

export async function POST(req) {
  try {
    const { city, locality, keyword, limit = 25 } = await req.json();

    if (!city || !keyword) {
      return NextResponse.json(
        { error: 'City and keyword are required.' },
        { status: 400 }
      );
    }

    // Combine locality if provided (e.g. "Dental Clinic in Govindpuram, Ghaziabad")
    const fullLocation = locality && locality.trim() 
      ? `${locality.trim()}, ${city.trim()}`
      : city.trim();

    const searchQuery = `${keyword.trim()} in ${fullLocation}`;

    // 1. Run Scraper
    const scrapedData = await scrapeGoogleMaps(searchQuery, limit);

    // 2. Connect to MongoDB Atlas and save/update leads
    let savedCount = 0;
    try {
      await dbConnect();
      
      const bulkOps = scrapedData.map((item) => ({
        updateOne: {
          filter: { searchQuery, title: item.title },
          update: {
            $set: {
              ...item,
              searchQuery,
              location: fullLocation,
              city: city.trim(),
              locality: locality ? locality.trim() : '',
              keyword: keyword.trim(),
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await Lead.bulkWrite(bulkOps);
        savedCount = bulkOps.length;
      }
    } catch (dbErr) {
      console.warn('MongoDB save warning (results still returned):', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      query: searchQuery,
      locationUsed: fullLocation,
      totalFound: scrapedData.length,
      savedToDb: savedCount,
      leads: scrapedData,
    });
  } catch (error) {
    console.error('API /api/scrape error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape Google Maps' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const keyword = searchParams.get('keyword');

    const filter = {};
    if (location) filter.location = new RegExp(location, 'i');
    if (keyword) filter.keyword = new RegExp(keyword, 'i');

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ success: true, count: leads.length, leads });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Database fetch error' },
      { status: 500 }
    );
  }
}
