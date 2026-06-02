import type { EventType, JobStatus } from "./types";

export function idr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function idrCompact(amount: number): string {
  if (amount >= 1_000_000)
    return `Rp ${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  if (amount >= 1_000)
    return `Rp ${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 0)}k`;
  return `Rp ${amount}`;
}

export const STATUS_FLOW: JobStatus[] = [
  "NEW",
  "ASSIGNED",
  "TRANSCRIBED",
  "REVIEWED",
  "COMPLETED",
];

export const STATUS_META: Record<
  JobStatus,
  { label: string; short: string; key: string }
> = {
  NEW: { label: "New", short: "New", key: "new" },
  ASSIGNED: { label: "Assigned", short: "Assigned", key: "assigned" },
  TRANSCRIBED: { label: "Transcribed", short: "Transcribed", key: "transcribed" },
  REVIEWED: { label: "Reviewed", short: "Reviewed", key: "reviewed" },
  COMPLETED: { label: "Completed", short: "Done", key: "completed" },
};

export const EVENT_META: Record<EventType, { label: string; key: string }> = {
  created: { label: "Job created", key: "new" },
  reporter_assigned: { label: "Reporter assigned", key: "assigned" },
  transcribed: { label: "Transcribed", key: "transcribed" },
  editor_assigned: { label: "Editor assigned", key: "transcribed" },
  reviewed: { label: "Reviewed", key: "reviewed" },
  completed: { label: "Completed", key: "completed" },
};

export function formatDateTime(iso: string): string {
  // SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC.
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const d = new Date(iso.replace(" ", "T") + "Z").getTime();
  if (Number.isNaN(d)) return "";
  const secs = Math.round((Date.now() - d) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
