import { describe, expect, it } from "vitest";
import { calculatePayment, REPORTER_RATE_PER_MINUTE } from "../payment.js";
import type { Editor, Job } from "../types.js";

const baseJob: Job = {
  id: 1,
  case_name: "Test",
  duration_minutes: 90,
  location: "remote",
  city: null,
  status: "NEW",
  reporter_id: null,
  editor_id: null,
  review_status: null,
  created_at: "2026-01-01 00:00:00",
};

const editor: Editor = { id: 1, name: "Ed", flat_fee: 75000 };

describe("calculatePayment", () => {
  it("is zero when nobody is assigned", () => {
    const p = calculatePayment(baseJob, null);
    expect(p.reporter_payout).toBe(0);
    expect(p.editor_payout).toBe(0);
    expect(p.total_payout).toBe(0);
  });

  it("pays the reporter per minute once assigned", () => {
    const p = calculatePayment({ ...baseJob, reporter_id: 5 }, null);
    expect(p.reporter_payout).toBe(90 * REPORTER_RATE_PER_MINUTE);
    expect(p.total_payout).toBe(180000);
  });

  it("adds the editor flat fee once an editor is assigned", () => {
    const p = calculatePayment(
      { ...baseJob, reporter_id: 5, editor_id: 1 },
      editor
    );
    expect(p.reporter_payout).toBe(180000);
    expect(p.editor_payout).toBe(75000);
    expect(p.total_payout).toBe(255000);
  });

  it("does not pay an editor that is not assigned even if passed", () => {
    const p = calculatePayment({ ...baseJob, reporter_id: 5 }, editor);
    expect(p.editor_payout).toBe(0);
  });
});
