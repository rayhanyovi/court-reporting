import { useState } from "react";
import { DataProvider, useData } from "./data";
import { ToastProvider } from "./toast";
import { useHashRoute, type Route } from "./useHashRoute";
import { Button, EmptyState } from "./ui";
import {
  IconDashboard,
  IconBoard,
  IconWave,
  IconPen,
  IconPlus,
  IconHammer,
  IconAlert,
} from "./components/icons";
import { Dashboard } from "./views/Dashboard";
import { Board } from "./views/Board";
import { Reporters } from "./views/Reporters";
import { Editors } from "./views/Editors";
import { CreateJobModal } from "./components/CreateJobModal";
import { CreatePersonModal } from "./components/CreatePersonModal";

type ModalKind = null | "job" | "reporter" | "editor";

const PAGE_META: Record<Route, { title: string; sub: string }> = {
  dashboard: {
    title: "Dashboard",
    sub: "Operational overview of jobs, payouts, and your team",
  },
  board: {
    title: "Workflow Board",
    sub: "Track every case from intake through completion",
  },
  reporters: {
    title: "Reporters",
    sub: "Field staff who capture and transcribe proceedings",
  },
  editors: {
    title: "Editors",
    sub: "Reviewers who finalize transcripts for delivery",
  },
};

const NAV: { route: Route; label: string; icon: typeof IconDashboard }[] = [
  { route: "dashboard", label: "Dashboard", icon: IconDashboard },
  { route: "board", label: "Workflow Board", icon: IconBoard },
  { route: "reporters", label: "Reporters", icon: IconWave },
  { route: "editors", label: "Editors", icon: IconPen },
];

function Shell() {
  const [route, navigate] = useHashRoute();
  const { jobs, reporters, editors, error } = useData();
  const [modal, setModal] = useState<ModalKind>(null);

  const counts: Record<Route, number | null> = {
    dashboard: null,
    board: jobs.length,
    reporters: reporters.length,
    editors: editors.length,
  };

  const meta = PAGE_META[route];

  const topAction =
    route === "reporters" ? (
      <Button variant="primary" onClick={() => setModal("reporter")}>
        <IconPlus size={17} /> Add Reporter
      </Button>
    ) : route === "editors" ? (
      <Button variant="primary" onClick={() => setModal("editor")}>
        <IconPlus size={17} /> Add Editor
      </Button>
    ) : (
      <Button variant="primary" onClick={() => setModal("job")}>
        <IconPlus size={17} /> New Job
      </Button>
    );

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <IconHammer size={21} />
          </div>
          <div>
            <div className="brand-name">VoiceScript</div>
            <div className="brand-sub">Reporting Ops</div>
          </div>
        </div>
        <div className="nav-label">Workspace</div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const count = counts[item.route];
          return (
            <button
              key={item.route}
              className={`nav-item ${route === item.route ? "active" : ""}`}
              onClick={() => navigate(item.route)}
              aria-current={route === item.route ? "page" : undefined}
            >
              <Icon size={18} />
              {item.label}
              {count != null && count > 0 && (
                <span className="badge-count">{count}</span>
              )}
            </button>
          );
        })}
        <div className="sidebar-foot">
          VoiceScript
          <br />
          Made by Yovi for VoiceScript Technical Assessment purpose
        </div>
      </nav>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{meta.title}</h1>
            <div className="page-sub">{meta.sub}</div>
          </div>
          <div className="topbar-spacer" />
          {topAction}
        </header>

        <main className="content">
          {error ? (
            <div className="card card-pad">
              <EmptyState
                icon={<IconAlert size={26} />}
                title="Couldn't reach the server"
                message={error}
                action={
                  <Button
                    variant="primary"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                }
              />
            </div>
          ) : route === "dashboard" ? (
            <Dashboard
              onNewJob={() => setModal("job")}
              goBoard={() => navigate("board")}
            />
          ) : route === "board" ? (
            <Board onNewJob={() => setModal("job")} />
          ) : route === "reporters" ? (
            <Reporters onAdd={() => setModal("reporter")} />
          ) : (
            <Editors onAdd={() => setModal("editor")} />
          )}
        </main>
      </div>

      {modal === "job" && <CreateJobModal onClose={() => setModal(null)} />}
      {modal === "reporter" && (
        <CreatePersonModal kind="reporter" onClose={() => setModal(null)} />
      )}
      {modal === "editor" && (
        <CreatePersonModal kind="editor" onClose={() => setModal(null)} />
      )}
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </ToastProvider>
  );
}
