import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH ?? join(__dirname, "..", "data.sqlite");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS reporters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    availability TEXT NOT NULL DEFAULT 'available'
      CHECK (availability IN ('available', 'busy'))
  );

  CREATE TABLE IF NOT EXISTS editors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    flat_fee INTEGER NOT NULL DEFAULT 50000
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    location TEXT NOT NULL CHECK (location IN ('physical', 'remote')),
    city TEXT,
    status TEXT NOT NULL DEFAULT 'NEW'
      CHECK (status IN ('NEW','ASSIGNED','TRANSCRIBED','REVIEWED','COMPLETED')),
    reporter_id INTEGER REFERENCES reporters(id),
    editor_id INTEGER REFERENCES editors(id),
    review_status TEXT CHECK (review_status IN ('pending','in_review','approved')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS job_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export function initDb(): void {
  db.exec(SCHEMA);
  seed();
}

// Drops and rebuilds everything — used by the test suite for isolation.
export function resetDb(): void {
  db.exec(`
    DROP TABLE IF EXISTS job_events;
    DROP TABLE IF EXISTS jobs;
    DROP TABLE IF EXISTS reporters;
    DROP TABLE IF EXISTS editors;
  `);
  db.exec(SCHEMA);
  seed();
}

function seed(): void {
  const reporterCount = db
    .prepare("SELECT COUNT(*) AS c FROM reporters")
    .get() as { c: number };
  if (reporterCount.c === 0) {
    const insert = db.prepare(
      "INSERT INTO reporters (name, city, availability) VALUES (?, ?, ?)"
    );
    const reporters: [string, string, string][] = [
      ["Dewi Lestari", "Jakarta", "available"],
      ["Budi Santoso", "Jakarta", "available"],
      ["Sari Wijaya", "Bandung", "available"],
      ["Andi Pratama", "Surabaya", "available"],
      ["Maya Putri", "Bandung", "available"],
      ["Reza Firmansyah", "Jakarta", "available"],
    ];
    for (const r of reporters) insert.run(...r);
  }

  const editorCount = db
    .prepare("SELECT COUNT(*) AS c FROM editors")
    .get() as { c: number };
  if (editorCount.c === 0) {
    const insert = db.prepare(
      "INSERT INTO editors (name, flat_fee) VALUES (?, ?)"
    );
    insert.run("Rina Hapsari", 50000);
    insert.run("Tono Marlito", 75000);
    insert.run("Citra Dewanti", 60000);
  }
}
