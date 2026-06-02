import { db } from "./db.js";
import { calculatePayment, REPORTER_RATE_PER_MINUTE } from "./payment.js";
import {
  JOB_STATUSES,
  LOCATIONS,
  type Editor,
  type EventType,
  type Job,
  type JobEvent,
  type JobStatus,
  type JobWithDetails,
  type Location,
  type Reporter,
  type Stats,
} from "./types.js";

export function getReporter(id: number): Reporter | null {
  return (
    (db.prepare("SELECT * FROM reporters WHERE id = ?").get(id) as Reporter) ??
    null
  );
}

export function getEditor(id: number): Editor | null {
  return (
    (db.prepare("SELECT * FROM editors WHERE id = ?").get(id) as Editor) ?? null
  );
}

export function getJob(id: number): Job | null {
  return (db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Job) ?? null;
}

export function recordEvent(
  jobId: number,
  type: EventType,
  message: string
): void {
  db.prepare(
    "INSERT INTO job_events (job_id, type, message) VALUES (?, ?, ?)"
  ).run(jobId, type, message);
}

export function getEvents(jobId: number): JobEvent[] {
  return db
    .prepare("SELECT * FROM job_events WHERE job_id = ? ORDER BY id ASC")
    .all(jobId) as JobEvent[];
}

export function withDetails(job: Job, includeEvents = false): JobWithDetails {
  const reporter = job.reporter_id ? getReporter(job.reporter_id) : null;
  const editor = job.editor_id ? getEditor(job.editor_id) : null;
  const details: JobWithDetails = {
    ...job,
    reporter,
    editor,
    payment: calculatePayment(job, editor),
  };
  if (includeEvents) details.events = getEvents(job.id);
  return details;
}

export interface JobFilter {
  status?: JobStatus;
  q?: string;
}

export function listJobsWithDetails(filter: JobFilter = {}): JobWithDetails[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status) {
    where.push("status = ?");
    params.push(filter.status);
  }
  if (filter.q) {
    where.push("case_name LIKE ?");
    params.push(`%${filter.q}%`);
  }
  const sql =
    "SELECT * FROM jobs" +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY created_at DESC, id DESC";
  const jobs = db.prepare(sql).all(...params) as Job[];
  return jobs.map((j) => withDetails(j));
}

export function listReporters(): Reporter[] {
  return db.prepare("SELECT * FROM reporters ORDER BY name").all() as Reporter[];
}

export function listEditors(): Editor[] {
  return db.prepare("SELECT * FROM editors ORDER BY name").all() as Editor[];
}

/**
 * Reporter suggestions for a job. For physical jobs we prefer reporters in the
 * same city; remote jobs can use anyone. Available reporters always rank above
 * busy ones, and (for physical) same-city above out-of-city.
 */
export function suggestReporters(job: Job): Reporter[] {
  const reporters = listReporters();
  const score = (r: Reporter): number => {
    let s = 0;
    if (r.availability === "available") s += 2;
    if (job.location === "physical" && job.city && r.city === job.city) s += 4;
    return s;
  };
  return [...reporters].sort((a, b) => score(b) - score(a));
}

export function computeStats(): Stats {
  const jobs = listJobsWithDetails();

  const byStatus = Object.fromEntries(
    JOB_STATUSES.map((s) => [s, 0])
  ) as Record<JobStatus, number>;
  const byLocation = Object.fromEntries(
    LOCATIONS.map((l) => [l, 0])
  ) as Record<Location, number>;

  let totalPayout = 0;
  let projectedPayout = 0;
  let totalMinutes = 0;
  const reporterAgg = new Map<number, { name: string; jobs: number; earned: number }>();
  const editorAgg = new Map<number, { name: string; jobs: number; earned: number }>();

  for (const job of jobs) {
    byStatus[job.status] += 1;
    byLocation[job.location] += 1;
    totalMinutes += job.duration_minutes;
    projectedPayout += job.payment.total_payout;
    if (job.status === "COMPLETED") totalPayout += job.payment.total_payout;

    if (job.reporter) {
      const a = reporterAgg.get(job.reporter.id) ?? {
        name: job.reporter.name,
        jobs: 0,
        earned: 0,
      };
      a.jobs += 1;
      a.earned += job.payment.reporter_payout;
      reporterAgg.set(job.reporter.id, a);
    }
    if (job.editor) {
      const a = editorAgg.get(job.editor.id) ?? {
        name: job.editor.name,
        jobs: 0,
        earned: 0,
      };
      a.jobs += 1;
      a.earned += job.payment.editor_payout;
      editorAgg.set(job.editor.id, a);
    }
  }

  const toRanked = (m: Map<number, { name: string; jobs: number; earned: number }>) =>
    [...m.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 5);

  const availableReporters = listReporters().filter(
    (r) => r.availability === "available"
  ).length;

  return {
    total_jobs: jobs.length,
    in_progress: jobs.filter((j) => j.status !== "COMPLETED").length,
    completed: byStatus.COMPLETED,
    total_payout: totalPayout,
    projected_payout: projectedPayout,
    total_minutes: totalMinutes,
    by_status: byStatus,
    by_location: byLocation,
    available_reporters: availableReporters,
    top_reporters: toRanked(reporterAgg),
    top_editors: toRanked(editorAgg),
  };
}

export { REPORTER_RATE_PER_MINUTE };
