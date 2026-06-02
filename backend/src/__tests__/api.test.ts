import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { resetDb } from "../db.js";

let app: Express;

beforeEach(() => {
  resetDb();
  app = createApp();
});

async function createJob(body: Record<string, unknown>) {
  return request(app).post("/api/jobs").send(body);
}

describe("job creation + validation", () => {
  it("creates a remote job in NEW with a 'created' event", async () => {
    const res = await createJob({
      case_name: "Remote depo",
      duration_minutes: 45,
      location: "remote",
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("NEW");
    expect(res.body.payment.total_payout).toBe(0);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].type).toBe("created");
  });

  it("rejects a physical job without a city (400, error envelope)", async () => {
    const res = await createJob({
      case_name: "No city",
      duration_minutes: 30,
      location: "physical",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty("message");
  });

  it("rejects a non-positive duration", async () => {
    const res = await createJob({
      case_name: "Bad",
      duration_minutes: 0,
      location: "remote",
    });
    expect(res.status).toBe(400);
  });
});

describe("reporter suggestions", () => {
  it("ranks same-city available reporters first for physical jobs", async () => {
    const job = await createJob({
      case_name: "Jakarta case",
      duration_minutes: 60,
      location: "physical",
      city: "Jakarta",
    });
    const res = await request(app).get(
      `/api/jobs/${job.body.id}/reporter-suggestions`
    );
    expect(res.status).toBe(200);
    expect(res.body[0].city).toBe("Jakarta");
    expect(res.body[0].availability).toBe("available");
  });
});

describe("full lifecycle + payment + audit trail", () => {
  it("walks NEW -> COMPLETED and computes payment correctly", async () => {
    const job = (
      await createJob({
        case_name: "State v. Doe",
        duration_minutes: 90,
        location: "physical",
        city: "Jakarta",
      })
    ).body;

    const sugg = (
      await request(app).get(`/api/jobs/${job.id}/reporter-suggestions`)
    ).body;
    const reporter = sugg[0];

    let res = await request(app)
      .post(`/api/jobs/${job.id}/assign-reporter`)
      .send({ reporter_id: reporter.id });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ASSIGNED");
    expect(res.body.reporter.availability).toBe("busy");
    expect(res.body.payment.reporter_payout).toBe(180000);

    res = await request(app)
      .patch(`/api/jobs/${job.id}/status`)
      .send({ status: "TRANSCRIBED" });
    expect(res.body.status).toBe("TRANSCRIBED");

    const editors = (await request(app).get("/api/editors")).body;
    const editor = editors.find((e: { flat_fee: number }) => e.flat_fee === 75000);
    res = await request(app)
      .post(`/api/jobs/${job.id}/assign-editor`)
      .send({ editor_id: editor.id });
    expect(res.body.review_status).toBe("in_review");
    expect(res.body.payment.editor_payout).toBe(75000);
    expect(res.body.payment.total_payout).toBe(255000);

    res = await request(app)
      .patch(`/api/jobs/${job.id}/status`)
      .send({ status: "REVIEWED" });
    expect(res.body.review_status).toBe("approved");

    res = await request(app)
      .patch(`/api/jobs/${job.id}/status`)
      .send({ status: "COMPLETED" });
    expect(res.body.status).toBe("COMPLETED");
    // Reporter is freed once the job completes.
    expect(res.body.reporter.availability).toBe("available");

    const types = res.body.events.map((e: { type: string }) => e.type);
    expect(types).toEqual([
      "created",
      "reporter_assigned",
      "transcribed",
      "editor_assigned",
      "reviewed",
      "completed",
    ]);
  });
});

describe("workflow guards", () => {
  it("404s for a missing job", async () => {
    const res = await request(app).get("/api/jobs/9999");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });

  it("rejects assigning an editor before transcription", async () => {
    const job = (
      await createJob({
        case_name: "Early editor",
        duration_minutes: 30,
        location: "remote",
      })
    ).body;
    const res = await request(app)
      .post(`/api/jobs/${job.id}/assign-editor`)
      .send({ editor_id: 1 });
    expect(res.status).toBe(409);
  });

  it("rejects an illegal status jump", async () => {
    const job = (
      await createJob({
        case_name: "Jumpy",
        duration_minutes: 30,
        location: "remote",
      })
    ).body;
    const res = await request(app)
      .patch(`/api/jobs/${job.id}/status`)
      .send({ status: "COMPLETED" });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/invalid transition/i);
  });

  it("rejects reviewing without an assigned editor", async () => {
    const job = (
      await createJob({
        case_name: "No editor",
        duration_minutes: 30,
        location: "physical",
        city: "Jakarta",
      })
    ).body;
    await request(app)
      .post(`/api/jobs/${job.id}/assign-reporter`)
      .send({ reporter_id: 1 });
    await request(app)
      .patch(`/api/jobs/${job.id}/status`)
      .send({ status: "TRANSCRIBED" });
    const res = await request(app)
      .patch(`/api/jobs/${job.id}/status`)
      .send({ status: "REVIEWED" });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/editor/i);
  });

  it("rejects reassigning a reporter after the job leaves NEW", async () => {
    const job = (
      await createJob({
        case_name: "Locked",
        duration_minutes: 30,
        location: "physical",
        city: "Jakarta",
      })
    ).body;
    await request(app)
      .post(`/api/jobs/${job.id}/assign-reporter`)
      .send({ reporter_id: 1 });
    const res = await request(app)
      .post(`/api/jobs/${job.id}/assign-reporter`)
      .send({ reporter_id: 2 });
    expect(res.status).toBe(409);
  });
});

describe("listing + filtering", () => {
  it("filters by status and search query", async () => {
    await createJob({ case_name: "Alpha", duration_minutes: 10, location: "remote" });
    const beta = (
      await createJob({ case_name: "Beta", duration_minutes: 10, location: "remote" })
    ).body;
    await request(app)
      .post(`/api/jobs/${beta.id}/assign-reporter`)
      .send({ reporter_id: 1 });

    const all = await request(app).get("/api/jobs");
    expect(all.body).toHaveLength(2);

    const newOnly = await request(app).get("/api/jobs?status=NEW");
    expect(newOnly.body).toHaveLength(1);
    expect(newOnly.body[0].case_name).toBe("Alpha");

    const search = await request(app).get("/api/jobs?q=Bet");
    expect(search.body).toHaveLength(1);
    expect(search.body[0].case_name).toBe("Beta");
  });
});

describe("stats", () => {
  it("aggregates totals, status counts, and earners", async () => {
    const job = (
      await createJob({
        case_name: "Stat job",
        duration_minutes: 100,
        location: "physical",
        city: "Bandung",
      })
    ).body;
    await request(app)
      .post(`/api/jobs/${job.id}/assign-reporter`)
      .send({ reporter_id: 3 });

    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(200);
    expect(res.body.total_jobs).toBe(1);
    expect(res.body.in_progress).toBe(1);
    expect(res.body.by_status.ASSIGNED).toBe(1);
    expect(res.body.by_location.physical).toBe(1);
    expect(res.body.projected_payout).toBe(200000);
    expect(res.body.top_reporters[0].earned).toBe(200000);
  });
});
