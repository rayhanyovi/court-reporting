import type {
  Editor,
  Job,
  JobStatus,
  Location,
  Reporter,
  Stats,
} from "./types";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.error?.message ?? body?.error ?? `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface JobQuery {
  status?: JobStatus;
  q?: string;
}

export const api = {
  stats: () => req<Stats>("/api/stats"),

  listJobs: (query: JobQuery = {}) => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.q) params.set("q", query.q);
    const qs = params.toString();
    return req<Job[]>(`/api/jobs${qs ? `?${qs}` : ""}`);
  },
  getJob: (id: number) => req<Job>(`/api/jobs/${id}`),
  createJob: (data: {
    case_name: string;
    duration_minutes: number;
    location: Location;
    city?: string;
  }) => req<Job>("/api/jobs", { method: "POST", body: JSON.stringify(data) }),
  reporterSuggestions: (jobId: number) =>
    req<Reporter[]>(`/api/jobs/${jobId}/reporter-suggestions`),
  assignReporter: (jobId: number, reporter_id: number) =>
    req<Job>(`/api/jobs/${jobId}/assign-reporter`, {
      method: "POST",
      body: JSON.stringify({ reporter_id }),
    }),
  assignEditor: (jobId: number, editor_id: number) =>
    req<Job>(`/api/jobs/${jobId}/assign-editor`, {
      method: "POST",
      body: JSON.stringify({ editor_id }),
    }),
  updateStatus: (jobId: number, status: JobStatus) =>
    req<Job>(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  listReporters: () => req<Reporter[]>("/api/reporters"),
  createReporter: (data: { name: string; city: string }) =>
    req<Reporter>("/api/reporters", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listEditors: () => req<Editor[]>("/api/editors"),
  createEditor: (data: { name: string; flat_fee: number }) =>
    req<Editor>("/api/editors", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
