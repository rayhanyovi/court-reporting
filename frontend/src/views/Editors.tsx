import { useMemo } from "react";
import { useData } from "../data";
import { idr } from "../format";
import { Avatar, Button, EmptyState, Skeleton } from "../ui";
import { IconPen } from "../components/icons";

export function Editors({ onAdd }: { onAdd: () => void }) {
  const { editors, jobs, loading } = useData();

  const rows = useMemo(() => {
    return editors
      .map((e) => {
        const mine = jobs.filter((j) => j.editor?.id === e.id);
        const earned = mine.reduce((s, j) => s + j.payment.editor_payout, 0);
        const active = mine.filter((j) => j.status !== "COMPLETED").length;
        return { e, count: mine.length, active, earned };
      })
      .sort((a, b) => b.earned - a.earned || a.e.name.localeCompare(b.e.name));
  }, [editors, jobs]);

  if (loading) return <TableSkeleton />;

  if (editors.length === 0) {
    return (
      <div className="card card-pad">
        <EmptyState
          icon={<IconPen size={26} />}
          title="No editors yet"
          message="Add editors and their flat per-job fee. They become assignable once a job has been transcribed."
          action={
            <Button variant="primary" onClick={onAdd}>
              Add editor
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
            <th>Editor</th>
            <th>Flat fee / job</th>
            <th>Jobs</th>
            <th style={{ textAlign: "right" }}>Earned</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ e, count, active, earned }) => (
            <tr key={e.id}>
              <td>
                <div className="cell-name">
                  <Avatar name={e.name} />
                  <span style={{ fontWeight: 600 }}>{e.name}</span>
                </div>
              </td>
              <td className="num">{idr(e.flat_fee)}</td>
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
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton w={34} h={34} r={999} />
          <Skeleton w={160} h={14} />
          <div style={{ flex: 1 }} />
          <Skeleton w={80} h={14} />
        </div>
      ))}
    </div>
  );
}
