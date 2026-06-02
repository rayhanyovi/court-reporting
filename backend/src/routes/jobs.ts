import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { badRequest, conflict, handler, notFound } from "../errors.js";
import {
  getEditor,
  getJob,
  getReporter,
  listJobsWithDetails,
  recordEvent,
  suggestReporters,
  withDetails,
} from "../repo.js";
import { canTransition } from "../workflow.js";
import { JOB_STATUSES, LOCATIONS } from "../types.js";
import type { Job, JobStatus } from "../types.js";

export const jobsRouter = Router();

const createJobSchema = z
  .object({
    case_name: z.string().min(1),
    duration_minutes: z.number().int().positive(),
    location: z.enum(LOCATIONS),
    city: z.string().min(1).optional(),
  })
  .refine((d) => d.location !== "physical" || !!d.city, {
    message: "city is required for physical jobs",
    path: ["city"],
  });

const listQuerySchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  q: z.string().trim().min(1).optional(),
});

jobsRouter.get(
  "/",
  handler((req, res) => {
    const { status, q } = listQuerySchema.parse(req.query);
    res.json(listJobsWithDetails({ status, q }));
  })
);

jobsRouter.get(
  "/:id",
  handler((req, res) => {
    const job = getJob(Number(req.params.id));
    if (!job) throw notFound("Job not found");
    res.json(withDetails(job, true));
  })
);

jobsRouter.post(
  "/",
  handler((req, res) => {
    const { case_name, duration_minutes, location, city } =
      createJobSchema.parse(req.body);
    const result = db
      .prepare(
        `INSERT INTO jobs (case_name, duration_minutes, location, city, status)
         VALUES (?, ?, ?, ?, 'NEW')`
      )
      .run(
        case_name,
        duration_minutes,
        location,
        location === "physical" ? city : null
      );
    const id = Number(result.lastInsertRowid);
    recordEvent(id, "created", `Job created (${location}, ${duration_minutes} min)`);
    res.status(201).json(withDetails(getJob(id)!, true));
  })
);

jobsRouter.get(
  "/:id/reporter-suggestions",
  handler((req, res) => {
    const job = getJob(Number(req.params.id));
    if (!job) throw notFound("Job not found");
    res.json(suggestReporters(job));
  })
);

const assignReporterSchema = z.object({ reporter_id: z.number().int() });

jobsRouter.post(
  "/:id/assign-reporter",
  handler((req, res) => {
    const job = getJob(Number(req.params.id));
    if (!job) throw notFound("Job not found");
    if (job.status !== "NEW") {
      throw conflict(
        `Reporter can only be assigned while job is NEW (current: ${job.status})`
      );
    }
    const { reporter_id } = assignReporterSchema.parse(req.body);
    const reporter = getReporter(reporter_id);
    if (!reporter) throw badRequest("Reporter not found");

    const tx = db.transaction(() => {
      db.prepare(
        "UPDATE jobs SET reporter_id = ?, status = 'ASSIGNED' WHERE id = ?"
      ).run(reporter.id, job.id);
      db.prepare("UPDATE reporters SET availability = 'busy' WHERE id = ?").run(
        reporter.id
      );
      recordEvent(
        job.id,
        "reporter_assigned",
        `Assigned to ${reporter.name} (${reporter.city})`
      );
    });
    tx();
    res.json(withDetails(getJob(job.id)!, true));
  })
);

const assignEditorSchema = z.object({ editor_id: z.number().int() });

jobsRouter.post(
  "/:id/assign-editor",
  handler((req, res) => {
    const job = getJob(Number(req.params.id));
    if (!job) throw notFound("Job not found");
    if (job.status !== "TRANSCRIBED") {
      throw conflict(
        `Editor can only be assigned after transcription (current: ${job.status})`
      );
    }
    const { editor_id } = assignEditorSchema.parse(req.body);
    const editor = getEditor(editor_id);
    if (!editor) throw badRequest("Editor not found");

    const tx = db.transaction(() => {
      db.prepare(
        "UPDATE jobs SET editor_id = ?, review_status = 'in_review' WHERE id = ?"
      ).run(editor.id, job.id);
      recordEvent(job.id, "editor_assigned", `Editor ${editor.name} assigned for review`);
    });
    tx();
    res.json(withDetails(getJob(job.id)!, true));
  })
);

const statusSchema = z.object({ status: z.enum(JOB_STATUSES) });

jobsRouter.patch(
  "/:id/status",
  handler((req, res) => {
    const job = getJob(Number(req.params.id));
    if (!job) throw notFound("Job not found");
    const { status: target } = statusSchema.parse(req.body);

    if (!canTransition(job.status, target)) {
      throw conflict(`Invalid transition ${job.status} -> ${target}`);
    }
    const guardError = guardTransition(job, target);
    if (guardError) throw conflict(guardError);

    const tx = db.transaction(() => {
      db.prepare("UPDATE jobs SET status = ? WHERE id = ?").run(target, job.id);
      if (target === "REVIEWED") {
        db.prepare("UPDATE jobs SET review_status = 'approved' WHERE id = ?").run(
          job.id
        );
        recordEvent(job.id, "reviewed", "Review approved");
      }
      if (target === "TRANSCRIBED") {
        recordEvent(job.id, "transcribed", "Transcription completed");
      }
      if (target === "COMPLETED") {
        if (job.reporter_id) {
          db.prepare(
            "UPDATE reporters SET availability = 'available' WHERE id = ?"
          ).run(job.reporter_id);
        }
        recordEvent(job.id, "completed", "Job completed and payout finalized");
      }
    });
    tx();
    res.json(withDetails(getJob(job.id)!, true));
  })
);

function guardTransition(job: Job, target: JobStatus): string | null {
  if (target === "TRANSCRIBED" && !job.reporter_id) {
    return "Cannot mark transcribed without an assigned reporter";
  }
  if (target === "REVIEWED" && !job.editor_id) {
    return "Cannot mark reviewed without an assigned editor";
  }
  return null;
}
