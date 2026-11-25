import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req) {
  try {
    const { leads, filename = 'leads_export' } = await req.json();

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Leads array required' }, { status: 400 });
    }

    const dataToExport = leads.map((lead, idx) => ({
      '#': idx + 1,
      'Business Name': lead.title || 'N/A',
      'Has Website': lead.hasWebsite ? 'YES' : 'NO (WEBSITE LEAD)',
      'Website URL': lead.website || 'N/A',
      'Email': lead.email || 'N/A',
      'Phone Number': lead.phone || 'N/A',
      'Address': lead.address || 'N/A',
      'Category': lead.category || 'N/A',
      'Rating': lead.rating || 0,
      'Total Reviews': lead.reviewsCount || 0,
      'Lead Score': lead.leadScore || 50,
      'Priority': lead.priority || 'MEDIUM',
      'Google Maps Link': lead.gmbUrl || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
