import type { JobStatus } from "./types.js";

// Allowed forward transitions for the job lifecycle.
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  NEW: ["ASSIGNED"],
  ASSIGNED: ["TRANSCRIBED"],
  TRANSCRIBED: ["REVIEWED"],
  REVIEWED: ["COMPLETED"],
  COMPLETED: [],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: JobStatus): JobStatus[] {
  return TRANSITIONS[from];
}
