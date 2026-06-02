export const JOB_STATUSES = [
  "NEW",
  "ASSIGNED",
  "TRANSCRIBED",
  "REVIEWED",
  "COMPLETED",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const LOCATIONS = ["physical", "remote"] as const;
export type Location = (typeof LOCATIONS)[number];

export const AVAILABILITY = ["available", "busy"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const REVIEW_STATUSES = ["pending", "in_review", "approved"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface Reporter {
  id: number;
  name: string;
  city: string;
  availability: Availability;
}

export interface Editor {
  id: number;
  name: string;
  flat_fee: number;
}

export interface Job {
  id: number;
  case_name: string;
  duration_minutes: number;
  location: Location;
  city: string | null;
  status: JobStatus;
  reporter_id: number | null;
  editor_id: number | null;
  review_status: ReviewStatus | null;
  created_at: string;
}

export interface Payment {
  reporter_rate_per_minute: number;
  reporter_payout: number;
  editor_flat_fee: number;
  editor_payout: number;
  total_payout: number;
}

export const EVENT_TYPES = [
  "created",
  "reporter_assigned",
  "transcribed",
  "editor_assigned",
  "reviewed",
  "completed",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface JobEvent {
  id: number;
  job_id: number;
  type: EventType;
  message: string;
  created_at: string;
}

export interface JobWithDetails extends Job {
  reporter: Reporter | null;
  editor: Editor | null;
  payment: Payment;
  events?: JobEvent[];
}

export interface Stats {
  total_jobs: number;
  in_progress: number;
  completed: number;
  total_payout: number;
  projected_payout: number;
  total_minutes: number;
  by_status: Record<JobStatus, number>;
  by_location: Record<Location, number>;
  available_reporters: number;
  top_reporters: { id: number; name: string; jobs: number; earned: number }[];
  top_editors: { id: number; name: string; jobs: number; earned: number }[];
}
