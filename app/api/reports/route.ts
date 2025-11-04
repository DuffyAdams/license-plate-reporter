import { NextRequest, NextResponse } from 'next/server';
import { insertReport, getAllReports, getReportsByFilters } from '../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['plate', 'state_code', 'city', 'violation', 'vehicle_type', 'color'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Insert report
    const report = {
      id: Date.now().toString(),
      ...body,
      incident_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      media_count: body.media_count || 0
    };

    insertReport.run(
      report.id,
      report.plate,
      report.state_code,
      report.city,
      report.violation,
      report.vehicle_type,
      report.color,
      report.make || null,
      report.model || null,
      report.year ? Number(report.year) : null,
      report.gender_observed || null,
      report.description || null,
      report.reporter_email || null,
      report.contact_ok ? 1 : 0,
      report.incident_at,
      report.created_at,
      report.media_count
    );

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const violation = searchParams.get('violation');
    const vehicle_type = searchParams.get('vehicle_type');

    let reports;
    if (state || city || violation || vehicle_type) {
      reports = getReportsByFilters.all(
        state, state,
        city ? `%${city}%` : null, city ? `%${city}%` : null,
        violation, violation,
        vehicle_type, vehicle_type
      );
    } else {
      reports = getAllReports.all();
    }

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}