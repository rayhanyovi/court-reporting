import { useMemo } from "react";
import { useData } from "../data";
import { idr } from "../format";
import { Avatar, AvailabilityBadge, Button, EmptyState, Skeleton } from "../ui";
import { IconWave } from "../components/icons";

export function Reporters({ onAdd }: { onAdd: () => void }) {
  const { reporters, jobs, loading } = useData();

  const rows = useMemo(() => {
    return reporters
      .map((r) => {
        const mine = jobs.filter((j) => j.reporter?.id === r.id);
        const earned = mine.reduce((s, j) => s + j.payment.reporter_payout, 0);
        const active = mine.filter((j) => j.status !== "COMPLETED").length;
        return { r, count: mine.length, active, earned };
      })
      .sort((a, b) => b.earned - a.earned || a.r.name.localeCompare(b.r.name));
  }, [reporters, jobs]);

  if (loading) return <TableSkeleton />;

  if (reporters.length === 0) {
    return (
      <div className="card card-pad">
        <EmptyState
          icon={<IconWave size={26} />}
          title="No reporters yet"
          message="Add court reporters with their home city so the system can match them to in-person jobs."
          action={
            <Button variant="primary" onClick={onAdd}>
              Add reporter
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Reporter</th>
            <th>City</th>
            <th>Availability</th>
            <th>Jobs</th>
            <th style={{ textAlign: "right" }}>Earned</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ r, count, active, earned }) => (
            <tr key={r.id}>
              <td>
                <div className="cell-name">
                  <Avatar name={r.name} />
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                </div>
              </td>
              <td className="muted">{r.city}</td>
              <td>
                <AvailabilityBadge value={r.availability} />
              </td>
              <td>
                <span className="num">{count}</span>
                {active > 0 && (
                  <span className="muted-3" style={{ fontSize: 12 }}>
                    {" "}
                    · {active} active
                  </span>
                )}
              </td>
              <td className="num" style={{ textAlign: "right" }}>
                {idr(earned)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card card-pad" style={{ display: "grid", gap: 14 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <Skeleton w={34} h={34} r={999} />
          <Skeleton w={160} h={14} />
          <div style={{ flex: 1 }} />
          <Skeleton w={80} h={14} />
        </div>
      ))}
    </div>
  );
}
