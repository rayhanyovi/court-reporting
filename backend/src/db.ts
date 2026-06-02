import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDbPath = process.env.VERCEL
  ? join("/tmp", "voicescript-data.sqlite")
  : join(__dirname, "..", "data.sqlite");
const dbPath = process.env.DB_PATH ?? defaultDbPath;

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

  if (process.env.NODE_ENV !== "test") seedDemoJobs();
}

function seedDemoJobs(): void {
  const jobCount = db
    .prepare("SELECT COUNT(*) AS c FROM jobs")
    .get() as { c: number };
  if (jobCount.c > 0) return;

  const insertJob = db.prepare(
    `INSERT INTO jobs
      (case_name, duration_minutes, location, city, status, reporter_id, editor_id, review_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`
  );
  const insertEvent = db.prepare(
    `INSERT INTO job_events (job_id, type, message, created_at)
     VALUES (?, ?, ?, datetime('now', ?))`
  );

  function addJob({
    caseName,
    minutes,
    location,
    city = null,
    status,
    reporterId = null,
    editorId = null,
    reviewStatus = null,
    offset,
  }: {
    caseName: string;
    minutes: number;
    location: "physical" | "remote";
    city?: string | null;
    status: "NEW" | "ASSIGNED" | "TRANSCRIBED" | "REVIEWED" | "COMPLETED";
    reporterId?: number | null;
    editorId?: number | null;
    reviewStatus?: "pending" | "in_review" | "approved" | null;
    offset: string;
  }) {
    const result = insertJob.run(
      caseName,
      minutes,
      location,
      city,
      status,
      reporterId,
      editorId,
      reviewStatus,
      offset
    );
    const id = Number(result.lastInsertRowid);
    insertEvent.run(id, "created", `Job created (${location}, ${minutes} min)`, offset);
    if (reporterId) {
      insertEvent.run(id, "reporter_assigned", "Reporter assigned", offset);
    }
    if (status === "TRANSCRIBED" || status === "REVIEWED" || status === "COMPLETED") {
      insertEvent.run(id, "transcribed", "Transcription completed", offset);
    }
    if (editorId) {
      insertEvent.run(id, "editor_assigned", "Editor assigned for review", offset);
    }
    if (status === "REVIEWED" || status === "COMPLETED") {
      insertEvent.run(id, "reviewed", "Review approved", offset);
    }
    if (status === "COMPLETED") {
      insertEvent.run(id, "completed", "Job completed and payout finalized", offset);
    }
  }

  addJob({
    caseName: "Test Case — Demo Verification",
    minutes: 45,
    location: "physical",
    city: "Jakarta",
    status: "NEW",
    offset: "-2 hours",
  });
  addJob({
    caseName: "Remote Examination — Globalindo Tbk",
    minutes: 60,
    location: "remote",
    status: "NEW",
    offset: "-3 hours",
  });
  addJob({
    caseName: "Wibowo Family Trust — Mediation",
    minutes: 150,
    location: "physical",
    city: "Jakarta",
    status: "NEW",
    offset: "-4 hours",
  });
  addJob({
    caseName: "Intake Review — Nusantara Energy",
    minutes: 12,
    location: "physical",
    city: "Bandung",
    status: "NEW",
    offset: "-5 hours",
  });
  addJob({
    caseName: "State v. Pranoto — Pre-Trial Conference",
    minutes: 90,
    location: "physical",
    city: "Jakarta",
    status: "TRANSCRIBED",
    reporterId: 1,
    offset: "-1 day",
  });
  addJob({
    caseName: "Labor Tribunal — Sinar Logistik",
    minutes: 60,
    location: "physical",
    city: "Bandung",
    status: "TRANSCRIBED",
    reporterId: 3,
    offset: "-2 days",
  });
  addJob({
    caseName: "Pertiwi v. Dharma — Civil Dispute",
    minutes: 75,
    location: "remote",
    status: "TRANSCRIBED",
    reporterId: 2,
    editorId: 1,
    reviewStatus: "in_review",
    offset: "-3 days",
  });
  addJob({
    caseName: "State v. Nugroho — Witness Examination",
    minutes: 110,
    location: "physical",
    city: "Surabaya",
    status: "COMPLETED",
    reporterId: 4,
    editorId: 2,
    reviewStatus: "approved",
    offset: "-4 days",
  });
  addJob({
    caseName: "Estate of Halim — Probate Hearing",
    minutes: 130,
    location: "physical",
    city: "Bandung",
    status: "COMPLETED",
    reporterId: 5,
    editorId: 3,
    reviewStatus: "approved",
    offset: "-5 days",
  });
  addJob({
    caseName: "Remote Deposition — Chandra Holdings",
    minutes: 95,
    location: "remote",
    status: "COMPLETED",
    reporterId: 5,
    editorId: 1,
    reviewStatus: "approved",
    offset: "-6 days",
  });
  addJob({
    caseName: "PT Maju Bersama v. Sentosa — Arbitration",
    minutes: 180,
    location: "physical",
    city: "Jakarta",
    status: "COMPLETED",
    reporterId: 6,
    editorId: 2,
    reviewStatus: "approved",
    offset: "-7 days",
  });

  db.prepare("UPDATE reporters SET availability = 'busy' WHERE id IN (1, 2, 3)").run();
}
