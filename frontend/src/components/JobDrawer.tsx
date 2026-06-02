import { useEffect, useState } from "react";
import { api } from "../api";
import { useData } from "../data";
import { useToast } from "../toast";
import {
  EVENT_META,
  formatDateTime,
  formatDuration,
  idr,
  timeAgo,
} from "../format";
import { Avatar, AvailabilityBadge, Button, Drawer, StatusBadge } from "../ui";
import {
  IconBuilding,
  IconVideo,
  IconPlus,
  IconMic,
  IconFile,
  IconPen,
  IconEye,
  IconCheck,
  IconArrowRight,
  IconWallet,
} from "./icons";
import type { EventType, Job, Reporter, ReviewStatus } from "../types";

const EVENT_ICON: Record<EventType, React.ComponentType<{ size?: number }>> = {
  created: IconPlus,
  reporter_assigned: IconMic,
  transcribed: IconFile,
  editor_assigned: IconPen,
  reviewed: IconEye,
  completed: IconCheck,
};

const REVIEW_LABEL: Record<ReviewStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  approved: "Approved",
};

export function JobDrawer({
  jobId,
  onClose,
}: {
  jobId: number;
  onClose: () => void;
}) {
  const { editors, assignReporter, assignEditor, updateStatus } = useData();
  const toast = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [picking, setPicking] = useState<null | "reporter" | "editor">(null);
  const [suggestions, setSuggestions] = useState<Reporter[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getJob(jobId)
      .then((j) => alive && setJob(j))
      .catch((e) => alive && toast.error(e.message));
    return () => {
      alive = false;
    };
  }, [jobId, toast]);

  useEffect(() => {
    if (picking !== "reporter") return;
    let alive = true;
    setSuggestions(null);
    api
      .reporterSuggestions(jobId)
      .then((r) => alive && setSuggestions(r))
      .catch((e) => alive && toast.error(e.message));
    return () => {
      alive = false;
    };
  }, [picking, jobId, toast]);

  async function run(fn: () => Promise<Job>, msg: string) {
    setBusy(true);
    try {
      const updated = await fn();
      setJob(updated);
      setPicking(null);
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!job) {
    return (
      <Drawer title="Loading…" onClose={onClose}>
        <div className="muted">Loading job details…</div>
      </Drawer>
    );
  }

  const action = ((): {
    label: string;
    hint: string;
    icon: React.ComponentType<{ size?: number }>;
    run: () => void;
  } | null => {
    switch (job.status) {
      case "NEW":
        return {
          label: "Assign reporter",
          hint: "Pick a reporter to move this job to Assigned.",
          icon: IconMic,
          run: () => setPicking("reporter"),
        };
      case "ASSIGNED":
        return {
          label: "Mark as transcribed",
          hint: "Reporter has captured the proceeding — mark the transcript ready.",
          icon: IconFile,
          run: () =>
            run(() => updateStatus(job.id, "TRANSCRIBED"), "Marked as transcribed"),
        };
      case "TRANSCRIBED":
        return job.editor
          ? {
              label: "Mark as reviewed",
              hint: "Editor has reviewed the transcript — approve it.",
              icon: IconEye,
              run: () =>
                run(() => updateStatus(job.id, "REVIEWED"), "Review approved"),
            }
          : {
              label: "Assign editor",
              hint: "Assign an editor to review the transcript.",
              icon: IconPen,
              run: () => setPicking("editor"),
            };
      case "REVIEWED":
        return {
          label: "Mark as completed",
          hint: "Finalize the job, release the reporter, and lock the payout.",
          icon: IconCheck,
          run: () =>
            run(() => updateStatus(job.id, "COMPLETED"), "Job completed"),
        };
      default:
        return null;
    }
  })();

  return (
    <Drawer
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {job.case_name}
        </span>
      }
      onClose={onClose}
      footer={
        picking ? (
          <Button variant="secondary" block onClick={() => setPicking(null)}>
            Cancel
          </Button>
        ) : action ? (
          <>
            <Button
              variant="primary"
              block
              loading={busy}
              onClick={action.run}
            >
              <action.icon size={17} /> {action.label}
            </Button>
            <span className="next-hint">{action.hint}</span>
          </>
        ) : (
          <div
            className="next-hint"
            style={{ display: "flex", alignItems: "center", gap: 7 }}
          >
            <IconCheck size={15} /> This job is complete. Payout finalized.
          </div>
        )
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatusBadge status={job.status} />
        <span className="muted-3" style={{ fontSize: 12.5 }}>
          Job #{job.id} · created {timeAgo(job.created_at)}
        </span>
      </div>

      <div className="drawer-section">
        <div className="kv">
          <div>
            <div className="k">Location</div>
            <div
              className="v"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {job.location === "physical" ? (
                <>
                  <IconBuilding size={15} /> {job.city}
                </>
              ) : (
                <>
                  <IconVideo size={15} /> Remote
                </>
              )}
            </div>
          </div>
          <div>
            <div className="k">Duration</div>
            <div className="v tabular">{formatDuration(job.duration_minutes)}</div>
          </div>
          <div>
            <div className="k">Created</div>
            <div className="v">{formatDateTime(job.created_at)}</div>
          </div>
          <div>
            <div className="k">Review</div>
            <div className="v">
              {job.review_status ? REVIEW_LABEL[job.review_status] : "—"}
            </div>
          </div>
        </div>
      </div>

      {picking === "reporter" ? (
        <ReporterPicker
          suggestions={suggestions}
          job={job}
          busy={busy}
          onPick={(r) =>
            run(
              () => assignReporter(job.id, r.id),
              `${r.name} assigned to the job`,
            )
          }
        />
      ) : picking === "editor" ? (
        <div className="drawer-section">
          <h4>Choose an editor</h4>
          {editors.length === 0 ? (
            <p className="muted-3" style={{ fontSize: 13 }}>
              No editors available. Add one from the Editors page.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {editors.map((e) => (
                <button
                  key={e.id}
                  className="person-row"
                  style={{ border: "none", cursor: "pointer", textAlign: "left" }}
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => assignEditor(job.id, e.id),
                      `${e.name} assigned for review`,
                    )
                  }
                >
                  <Avatar name={e.name} />
                  <div>
                    <div className="pr-name">{e.name}</div>
                    <div className="pr-sub">Flat fee per job</div>
                  </div>
                  <div className="pr-amt tabular">{idr(e.flat_fee)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="drawer-section">
          <h4>Team</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {job.reporter ? (
              <div className="person-row">
                <Avatar name={job.reporter.name} />
                <div>
                  <div className="pr-name">{job.reporter.name}</div>
                  <div className="pr-sub">Reporter · {job.reporter.city}</div>
                </div>
                <div className="pr-amt tabular">
                  {idr(job.payment.reporter_payout)}
                </div>
              </div>
            ) : (
              <div className="person-row">
                <div className="avatar" style={{ background: "var(--text-3)" }}>
                  <IconMic size={16} />
                </div>
                <div>
                  <div className="pr-name">No reporter</div>
                  <div className="pr-sub">Assign to start the workflow</div>
                </div>
              </div>
            )}
            {job.editor ? (
              <div className="person-row">
                <Avatar name={job.editor.name} />
                <div>
                  <div className="pr-name">{job.editor.name}</div>
                  <div className="pr-sub">Editor · flat fee</div>
                </div>
                <div className="pr-amt tabular">
                  {idr(job.payment.editor_payout)}
                </div>
              </div>
            ) : (
              <div className="person-row">
                <div className="avatar" style={{ background: "var(--text-3)" }}>
                  <IconPen size={16} />
                </div>
                <div>
                  <div className="pr-name">No editor</div>
                  <div className="pr-sub">Assigned after transcription</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!picking && (
        <div className="drawer-section">
          <h4>Payment breakdown</h4>
          <div className="paybox">
            <div className="payrow">
              <span className="pl">
                <IconMic size={15} /> Reporter
                {job.reporter
                  ? ` · ${job.duration_minutes} min × ${idr(
                      job.payment.reporter_rate_per_minute,
                    )}`
                  : ""}
              </span>
              <span className="pv tabular">
                {job.reporter ? idr(job.payment.reporter_payout) : "—"}
              </span>
            </div>
            <div className="payrow">
              <span className="pl">
                <IconPen size={15} /> Editor flat fee
              </span>
              <span className="pv tabular">
                {job.editor ? idr(job.payment.editor_payout) : "—"}
              </span>
            </div>
            <div className="payrow total">
              <span className="pl">
                <IconWallet size={16} /> Total payout
              </span>
              <span className="pv tabular">
                {idr(job.payment.total_payout)}
              </span>
            </div>
          </div>
        </div>
      )}

      {!picking && job.events && job.events.length > 0 && (
        <div className="drawer-section">
          <h4>Activity</h4>
          <div className="timeline">
            {job.events.map((ev) => {
              const em = EVENT_META[ev.type];
              const Ic = EVENT_ICON[ev.type];
              return (
                <div className="tl-item" key={ev.id}>
                  <div className="tl-rail">
                    <div className={`tl-dot s-bar-${em.key}`}>
                      <Ic size={14} />
                    </div>
                    <div className="tl-line" />
                  </div>
                  <div className="tl-body">
                    <div className="tl-title">{em.label}</div>
                    <div className="tl-msg">{ev.message}</div>
                    <div className="tl-time">{formatDateTime(ev.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function ReporterPicker({
  suggestions,
  job,
  busy,
  onPick,
}: {
  suggestions: Reporter[] | null;
  job: Job;
  busy: boolean;
  onPick: (r: Reporter) => void;
}) {
  const isSameCity = (r: Reporter) =>
    job.location === "physical" && job.city === r.city;

  const bestMatches =
    suggestions?.filter((r) => isSameCity(r) && r.availability === "available") ?? [];
  const rest =
    suggestions?.filter((r) => !(isSameCity(r) && r.availability === "available")) ?? [];

  function ReporterCard({ r, isBestMatch = false }: { r: Reporter; isBestMatch?: boolean }) {
    const sameCity = isSameCity(r);
    return (
      <div style={{ position: "relative", marginTop: isBestMatch ? 14 : 0 }}>
        {isBestMatch && (
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "translateY(-100%)",
              background: "#16a34a",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
              padding: "3px 10px",
              borderRadius: "6px 6px 0 0",
              lineHeight: 1.4,
              userSelect: "none",
            }}
          >
            Best match
          </span>
        )}
        <button
          className="person-row"
          style={{
            border: `2px solid ${isBestMatch ? "#16a34a" : "var(--border)"}`,
            borderRadius: 10,
            borderTopLeftRadius: isBestMatch ? 0 : 10,
            background: isBestMatch ? "#16a34a0d" : "var(--surface)",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
          disabled={busy}
          onClick={() => onPick(r)}
        >
          <Avatar name={r.name} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="pr-name">{r.name}</div>
            <div
              className="pr-sub"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {r.city}
              <span style={{ opacity: 0.35 }}>·</span>
              {sameCity && !isBestMatch && (
                <span
                  className="badge s-assigned"
                  style={{ fontSize: 10.5, padding: "1px 7px", flexShrink: 0 }}
                >
                  Same city
                </span>
              )}
              <AvailabilityBadge value={r.availability} />
            </div>
          </div>
          <span style={{ flexShrink: 0 }}>
            <IconArrowRight size={16} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="drawer-section">
      <h4>Choose a reporter</h4>
      {job.location === "physical" && (
        <p className="muted-3" style={{ fontSize: 12, marginTop: -4, marginBottom: 11 }}>
          Ranked for {job.city} — same-city &amp; available first.
        </p>
      )}
      {suggestions === null ? (
        <p className="muted-3" style={{ fontSize: 13 }}>
          Finding the best matches…
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {bestMatches.map((r) => (
            <ReporterCard key={r.id} r={r} isBestMatch />
          ))}
          {rest.map((r) => (
            <ReporterCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
