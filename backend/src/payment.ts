import type { Editor, Job, Payment } from "./types.js";

export const REPORTER_RATE_PER_MINUTE = 2000; // IDR per minute

export function calculatePayment(job: Job, editor: Editor | null): Payment {
  const reporterPayout = job.reporter_id
    ? job.duration_minutes * REPORTER_RATE_PER_MINUTE
    : 0;
  const editorFlatFee = editor?.flat_fee ?? 0;
  const editorPayout = job.editor_id ? editorFlatFee : 0;

  return {
    reporter_rate_per_minute: REPORTER_RATE_PER_MINUTE,
    reporter_payout: reporterPayout,
    editor_flat_fee: editorFlatFee,
    editor_payout: editorPayout,
    total_payout: reporterPayout + editorPayout,
  };
}
