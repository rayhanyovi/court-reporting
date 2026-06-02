import { useData } from "../data";
import { idr, idrCompact, formatDuration, STATUS_FLOW, STATUS_META } from "../format";
import { Avatar, Button, EmptyState, Skeleton } from "../ui";
import {
  IconBriefcase,
  IconActivity,
  IconCheckCircle,
  IconWallet,
  IconArrowRight,
  IconAward,
  IconMic,
  IconPen,
  IconBuilding,
  IconVideo,
  IconInbox,
} from "../components/icons";
import type { Stats } from "../types";

export function Dashboard({
  onNewJob,
  goBoard,
}: {
  onNewJob: () => void;
  goBoard: () => void;
}) {
  const { stats, loading } = useData();

  if (loading || !stats) return <DashboardSkeleton />;

  if (stats.total_jobs === 0) {
    return (
      <div className="card card-pad">
        <EmptyState
          icon={<IconInbox size={26} />}
          title="No jobs yet"
          message="Create your first court reporting job to start tracking the workflow, assignments, and payouts."
          action={
            <Button variant="primary" onClick={onNewJob}>
              Create a job
            </Button>
          }
        />
      </div>
    );
  }

  const completionPct = Math.round((stats.completed / stats.total_jobs) * 100);

  return (
    <>
      <div className="kpi-grid">
        <Kpi
          label="Total Jobs"
          value={String(stats.total_jobs)}
          foot={`${formatDuration(stats.total_minutes)} recorded`}
          icon={<IconBriefcase size={20} />}
          tint="var(--primary-soft)"
          ink="var(--primary)"
        />
        <Kpi
          label="In Progress"
          value={String(stats.in_progress)}
          foot={`${stats.completed} completed`}
          icon={<IconActivity size={20} />}
          tint="var(--st-assigned-bg)"
          ink="var(--st-assigned-tx)"
        />
        <Kpi
          label="Completion"
          value={`${completionPct}%`}
          foot={`${stats.completed} of ${stats.total_jobs} delivered`}
          icon={<IconCheckCircle size={20} />}
          tint="var(--st-completed-bg)"
          ink="var(--st-completed-tx)"
        />
        <Kpi
          label="Total Payout"
          value={idrCompact(stats.total_payout)}
          foot={`${idr(stats.projected_payout)} projected`}
          icon={<IconWallet size={20} />}
          tint="var(--st-reviewed-bg)"
          ink="var(--st-reviewed-tx)"
        />
      </div>

      <div className="dash-grid">
        <div className="card card-pad">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="section-title">Jobs by status</div>
            <Button variant="ghost" size="sm" onClick={goBoard}>
              View board <IconArrowRight size={15} />
            </Button>
          </div>
          <StatusBars stats={stats} />
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 16 }}>
            By location
          </div>
          <LocationDonut stats={stats} />
        </div>
      </div>

      <div className="dash-grid">
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 6 }}>
            <IconAward size={17} /> Top reporters
          </div>
          {stats.top_reporters.length === 0 ? (
            <p className="muted-3" style={{ fontSize: 13 }}>
              No earnings recorded yet.
            </p>
          ) : (
            stats.top_reporters.map((r) => (
              <div className="earner" key={r.id}>
                <Avatar name={r.name} />
                <div>
                  <div className="earner-name">{r.name}</div>
                  <div className="earner-sub">
                    {r.jobs} {r.jobs === 1 ? "job" : "jobs"}
                  </div>
                </div>
                <div className="earner-amt tabular">{idr(r.earned)}</div>
              </div>
            ))
          )}
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 6 }}>
            <IconPen size={17} /> Top editors
          </div>
          {stats.top_editors.length === 0 ? (
            <p className="muted-3" style={{ fontSize: 13 }}>
              No earnings recorded yet.
            </p>
          ) : (
            stats.top_editors.map((e) => (
              <div className="earner" key={e.id}>
                <Avatar name={e.name} />
                <div>
                  <div className="earner-name">{e.name}</div>
                  <div className="earner-sub">
                    {e.jobs} {e.jobs === 1 ? "job" : "jobs"}
                  </div>
                </div>
                <div className="earner-amt tabular">{idr(e.earned)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  foot,
  icon,
  tint,
  ink,
}: {
  label: string;
  value: string;
  foot: string;
  icon: React.ReactNode;
  tint: string;
  ink: string;
}) {
  return (
    <div className="card kpi">
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        <div className="kpi-icon" style={{ background: tint, color: ink }}>
          {icon}
        </div>
      </div>
      <div className="kpi-value tabular">{value}</div>
      <div className="kpi-foot">{foot}</div>
    </div>
  );
}

function StatusBars({ stats }: { stats: Stats }) {
  const max = Math.max(1, ...STATUS_FLOW.map((s) => stats.by_status[s] ?? 0));
  return (
    <div className="bars">
      {STATUS_FLOW.map((s) => {
        const n = stats.by_status[s] ?? 0;
        const meta = STATUS_META[s];
        return (
          <div className="bar-row" key={s}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{meta.label}</span>
            <div className="bar-track">
              <div
                className={`bar-fill s-bar-${meta.key}`}
                style={{ width: `${(n / max) * 100}%` }}
              />
            </div>
            <span className="bar-val tabular">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

const PHYSICAL_COLOR = "#2B6CB0";
const REMOTE_COLOR = "#0ea5e9";

function LocationDonut({ stats }: { stats: Stats }) {
  const physical = stats.by_location.physical ?? 0;
  const remote = stats.by_location.remote ?? 0;
  const total = physical + remote;
  const physPct = total ? (physical / total) * 100 : 0;

  const bg = total
    ? `conic-gradient(${PHYSICAL_COLOR} 0 ${physPct}%, ${REMOTE_COLOR} ${physPct}% 100%)`
    : "var(--surface-2)";

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: bg }}>
        <div className="donut-center">
          <b className="tabular">{total}</b>
          <div className="muted-3" style={{ fontSize: 11 }}>
            jobs
          </div>
        </div>
      </div>
      <div className="legend">
        <div className="legend-item">
          <span className="swatch" style={{ background: PHYSICAL_COLOR }} />
          <IconBuilding size={15} /> Physical
          <b className="tabular">{physical}</b>
        </div>
        <div className="legend-item">
          <span className="swatch" style={{ background: REMOTE_COLOR }} />
          <IconVideo size={15} /> Remote
          <b className="tabular">{remote}</b>
        </div>
        <div
          className="legend-item"
          style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}
        >
          <span className="swatch" style={{ background: "var(--success)" }} />
          <IconMic size={15} /> Available reporters
          <b className="tabular">{stats.available_reporters}</b>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((i) => (
          <div className="card kpi" key={i}>
            <div className="kpi-top">
              <Skeleton w={80} h={13} />
              <Skeleton w={38} h={38} r={10} />
            </div>
            <Skeleton w={64} h={28} />
            <Skeleton w={120} h={12} />
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="card card-pad">
          <Skeleton w={140} h={16} />
          <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} h={10} />
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <Skeleton w={120} h={16} />
          <div style={{ marginTop: 18 }}>
            <Skeleton w={132} h={132} r={999} />
          </div>
        </div>
      </div>
    </>
  );
}
