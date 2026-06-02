import { useMemo, useState } from "react";
import { useData } from "../data";
import {
  idrCompact,
  formatDuration,
  STATUS_FLOW,
  STATUS_META,
} from "../format";
import { Avatar, Button, EmptyState, Skeleton } from "../ui";
import {
  IconSearch,
  IconClock,
  IconBuilding,
  IconVideo,
  IconInbox,
} from "../components/icons";
import { JobDrawer } from "../components/JobDrawer";
import type { Job, Location } from "../types";

type LocFilter = "all" | Location;

export function Board({ onNewJob }: { onNewJob: () => void }) {
  const { jobs, loading } = useData();
  const [query, setQuery] = useState("");
  const [loc, setLoc] = useState<LocFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (loc !== "all" && j.location !== loc) return false;
      if (q && !j.case_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jobs, query, loc]);

  const byStatus = useMemo(() => {
    const map: Record<string, Job[]> = {};
    for (const s of STATUS_FLOW) map[s] = [];
    for (const j of filtered) map[j.status]?.push(j);
    return map;
  }, [filtered]);

  const selected = selectedId
    ? jobs.find((j) => j.id === selectedId) ?? null
    : null;

  if (loading) return <BoardSkeleton />;

  if (jobs.length === 0) {
    return (
      <div className="card card-pad">
        <EmptyState
          icon={<IconInbox size={26} />}
          title="No jobs on the board"
          message="Create a job to begin the reporting workflow. It will appear in the New column, ready to assign."
          action={
            <Button variant="primary" onClick={onNewJob}>
              Create a job
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <span className="s-icon">
            <IconSearch size={17} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases…"
            aria-label="Search cases"
          />
        </div>
        <div className="segmented" role="tablist" aria-label="Filter by location">
          {(["all", "physical", "remote"] as LocFilter[]).map((opt) => (
            <button
              key={opt}
              className={loc === opt ? "active" : ""}
              onClick={() => setLoc(opt)}
              role="tab"
              aria-selected={loc === opt}
            >
              {opt === "all" ? "All" : opt === "physical" ? "Physical" : "Remote"}
            </button>
          ))}
        </div>
      </div>

      <div className="board">
        {STATUS_FLOW.map((status) => {
          const meta = STATUS_META[status];
          const items = byStatus[status] ?? [];
          return (
            <section className="col" key={status}>
              <div className="col-head">
                <span className={`dot-sm s-bar-${meta.key}`} />
                <span className="title">{meta.label}</span>
                <span className="badge-count">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <div className="col-empty">No jobs</div>
              ) : (
                items.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => setSelectedId(job.id)}
                  />
                ))
              )}
            </section>
          );
        })}
      </div>

      {selected && (
        <JobDrawer jobId={selected.id} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const meta = STATUS_META[job.status];
  return (
    <article
      className={`job-card b-${meta.key}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="jc-title">{job.case_name}</div>
      <div className="jc-meta">
        <span className="mi">
          <IconClock size={13} />
          {formatDuration(job.duration_minutes)}
        </span>
        <span className="mi">
          {job.location === "physical" ? (
            <IconBuilding size={13} />
          ) : (
            <IconVideo size={13} />
          )}
          {job.location === "physical" ? job.city ?? "Physical" : "Remote"}
        </span>
      </div>
      <div className="jc-foot">
        {job.reporter || job.editor ? (
          <div className="stack">
            {job.reporter && <Avatar name={job.reporter.name} />}
            {job.editor && <Avatar name={job.editor.name} />}
          </div>
        ) : (
          <span className="muted-3" style={{ fontSize: 12 }}>
            Unassigned
          </span>
        )}
        <span className="jc-pay tabular">
          {idrCompact(job.payment.total_payout)}
        </span>
      </div>
    </article>
  );
}

function BoardSkeleton() {
  return (
    <>
      <div className="toolbar">
        <Skeleton w={340} h={38} r={10} />
      </div>
      <div className="board">
        {STATUS_FLOW.map((s) => (
          <div className="col" key={s}>
            <Skeleton w={100} h={14} />
            <Skeleton h={92} r={13} />
            <Skeleton h={92} r={13} />
          </div>
        ))}
      </div>
    </>
  );
}
