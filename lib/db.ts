import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'reports.db');
const db = new Database(dbPath);

// Create reports table
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    plate TEXT NOT NULL,
    state_code TEXT NOT NULL,
    city TEXT NOT NULL,
    violation TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    color TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    gender_observed TEXT,
    description TEXT,
    reporter_email TEXT,
    contact_ok BOOLEAN DEFAULT FALSE,
    incident_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    media_count INTEGER DEFAULT 0
  )
`);

export default db;

// Helper functions
export const insertReport = db.prepare(`
  INSERT INTO reports (
    id, plate, state_code, city, violation, vehicle_type, color,
    make, model, year, gender_observed, description, reporter_email,
    contact_ok, incident_at, created_at, media_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export const getAllReports = db.prepare(`
  SELECT * FROM reports ORDER BY created_at DESC
`);

export const getReportsByFilters = db.prepare(`
  SELECT * FROM reports
  WHERE (? IS NULL OR state_code = ?)
    AND (? IS NULL OR city LIKE ?)
    AND (? IS NULL OR violation = ?)
    AND (? IS NULL OR vehicle_type = ?)
    AND (? IS NULL OR plate LIKE ?)
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`);