import { NextRequest, NextResponse } from 'next/server';
import { insertReport, getAllReports, getReportsByFilters } from '../../../lib/db';
import { z } from 'zod';
import citiesData from '../../../cities.json';
import { US_STATES, VIOLATIONS, VEHICLE_TYPES, COLORS, GENDERS } from '../../../lib/constants';
import { headers } from 'next/headers';

// Simple rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

// Profanity and PII filters (basic implementation)
const PROFANITY_WORDS = ['damn', 'hell', 'crap', 'ass', 'bastard', 'bitch', 'shit', 'fuck', 'cunt', 'pussy', 'dick', 'cock'];
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email (but allow reporter_email)
];

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

function moderateContent(text: string): { allowed: boolean; reason?: string } {
  if (!text) return { allowed: true };

  // Check profanity
  const lowerText = text.toLowerCase();
  for (const word of PROFANITY_WORDS) {
    if (lowerText.includes(word)) {
      return { allowed: false, reason: 'Content contains inappropriate language' };
    }
  }

  // Check PII (skip if it's an email field)
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: 'Content appears to contain personal information' };
    }
  }

  return { allowed: true };
}

// Zod schema for API validation
const apiReportSchema = z.object({
  plate: z.string().min(2).max(10),
  state_code: z.string().min(2).max(2),
  city: z.string().min(2),
  violation: z.enum(['speeding', 'reckless driving', 'texting / phone use', 'red light / stop sign', 'illegal parking', 'tailgating', 'unsafe lane change', 'failure to yield', 'hit and run', 'suspected dui']),
  vehicle_type: z.enum(['sedan', 'suv', 'pickup', 'coupe', 'hatchback', 'van/minivan', 'motorcycle', 'commercial truck', 'bus', 'other']),
  color: z.enum(['white', 'black', 'silver', 'gray', 'red', 'blue', 'green', 'yellow', 'orange', 'brown', 'tan', 'gold', 'other']),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  gender_observed: z.enum(['female', 'male', 'unknown']).optional(),
  description: z.string().max(500).optional(),
  reporter_email: z.string().email().optional().or(z.literal('')),
  contact_ok: z.number().int().min(0).max(1),
  media_count: z.number().int().min(0).optional()
}).refine((data) => {
  // Validate city belongs to state
  const stateName = US_STATES.find(state => state.code === data.state_code)?.name;
  if (stateName && stateName in citiesData) {
    return citiesData[stateName as keyof typeof citiesData].includes(data.city);
  }
  return false;
}, {
  message: 'Please select a valid city from the list',
  path: ['city']
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    const formData = await request.formData();

    const body = {
      plate: formData.get('plate') as string,
      state_code: formData.get('state_code') as string,
      city: formData.get('city') as string,
      violation: formData.get('violation') as string,
      vehicle_type: formData.get('vehicle_type') as string,
      color: formData.get('color') as string,
      make: (formData.get('make') as string) || undefined,
      model: (formData.get('model') as string) || undefined,
      year: formData.get('year') ? parseInt(formData.get('year') as string) : undefined,
      gender_observed: (formData.get('gender_observed') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      reporter_email: (formData.get('reporter_email') as string) || undefined,
      contact_ok: formData.get('contact_ok') === 'true' ? 1 : 0,
      media_count: 0
    };

    // Content moderation
    const fieldsToCheck = ['description', 'plate', 'make', 'model'];
    for (const field of fieldsToCheck) {
      if (body[field as keyof typeof body]) {
        const moderation = moderateContent(body[field as keyof typeof body] as string);
        if (!moderation.allowed) {
          return NextResponse.json({ errors: { [field]: moderation.reason } }, { status: 400 });
        }
      }
    }

    // Handle media files
    const mediaFiles = formData.getAll('media[]') as File[];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    const maxSize = 25 * 1024 * 1024; // 25MB

    const validFiles = mediaFiles.filter(file => validTypes.includes(file.type) && file.size <= maxSize);
    if (validFiles.length !== mediaFiles.length) {
      return NextResponse.json({ errors: { media: 'One or more files are invalid (wrong type or too large)' } }, { status: 400 });
    }

    body.media_count = validFiles.length;

    // Validate with zod
    const result = apiReportSchema.safeParse(body);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((error: z.ZodIssue) => {
        const field = error.path[0] as string;
        errors[field] = error.message;
      });
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Insert report
    const report = {
      id: Date.now().toString(),
      ...result.data,
      incident_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      media_count: body.media_count
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
      report.year || null,
      report.gender_observed || null,
      report.description || null,
      report.reporter_email || null,
      report.contact_ok,
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
    const plate = searchParams.get('plate');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor'); // For pagination, cursor is the last report ID

    let reports;
    let hasMore = false;

    if (state || city || violation || vehicle_type || plate) {
      // Get one extra to check if there are more
      const allFiltered = getReportsByFilters.all(
        state, state,
        city ? `%${city}%` : null, city ? `%${city}%` : null,
        violation, violation,
        vehicle_type, vehicle_type,
        plate ? `%${plate}%` : null, plate ? `%${plate}%` : null,
        limit + 1, 0
      );

      reports = allFiltered.slice(0, limit);
      hasMore = allFiltered.length > limit;
    } else {
      // Get one extra to check if there are more
      const allReports = getAllReports.all();
      const startIndex = cursor ? allReports.findIndex((r: any) => r.id === cursor) + 1 : 0;
      reports = allReports.slice(startIndex, startIndex + limit);
      hasMore = startIndex + limit < allReports.length;
    }

    return NextResponse.json({
      reports,
      hasMore,
      nextCursor: hasMore && reports.length > 0 ? (reports[reports.length - 1] as any).id : null
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}