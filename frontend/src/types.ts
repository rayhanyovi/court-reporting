export type JobStatus =
  | "NEW"
  | "ASSIGNED"
  | "TRANSCRIBED"
  | "REVIEWED"
  | "COMPLETED";

export type Location = "physical" | "remote";
export type Availability = "available" | "busy";
export type ReviewStatus = "pending" | "in_review" | "approved";

export type EventType =
  | "created"
  | "reporter_assigned"
  | "transcribed"
  | "editor_assigned"
  | "reviewed"
  | "completed";

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

export interface Payment {
  reporter_rate_per_minute: number;
  reporter_payout: number;
  editor_flat_fee: number;
  editor_payout: number;
  total_payout: number;
}

export interface JobEvent {
  id: number;
  job_id: number;
  type: EventType;
  message: string;
  created_at: string;
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
