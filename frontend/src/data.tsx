import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type {
  Editor,
  Job,
  JobStatus,
  Location,
  Reporter,
  Stats,
} from "./types";

interface DataApi {
  jobs: Job[];
  reporters: Reporter[];
  editors: Editor[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createJob: (data: {
    case_name: string;
    duration_minutes: number;
    location: Location;
    city?: string;
  }) => Promise<Job>;
  assignReporter: (jobId: number, reporterId: number) => Promise<Job>;
  assignEditor: (jobId: number, editorId: number) => Promise<Job>;
  updateStatus: (jobId: number, status: JobStatus) => Promise<Job>;
  createReporter: (data: { name: string; city: string }) => Promise<Reporter>;
  createEditor: (data: { name: string; flat_fee: number }) => Promise<Editor>;
}

const DataContext = createContext<DataApi | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [j, r, e, s] = await Promise.all([
      api.listJobs(),
      api.listReporters(),
      api.listEditors(),
      api.stats(),
    ]);
    setJobs(j);
    setReporters(r);
    setEditors(e);
    setStats(s);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        if (alive)
          setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  const wrap = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      const result = await fn();
      await refresh();
      return result;
    },
    [refresh],
  );

  const value: DataApi = {
    jobs,
    reporters,
    editors,
    stats,
    loading,
    error,
    refresh,
    createJob: (data) => wrap(() => api.createJob(data)),
    assignReporter: (jobId, reporterId) =>
      wrap(() => api.assignReporter(jobId, reporterId)),
    assignEditor: (jobId, editorId) =>
      wrap(() => api.assignEditor(jobId, editorId)),
    updateStatus: (jobId, status) => wrap(() => api.updateStatus(jobId, status)),
    createReporter: (data) => wrap(() => api.createReporter(data)),
    createEditor: (data) => wrap(() => api.createEditor(data)),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataApi {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
