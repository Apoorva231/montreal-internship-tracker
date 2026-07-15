import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Columns3,
  List,
  LogOut,
  Search,
  Target,
  Trophy
} from "lucide-react";
import { api } from "../api/client";
import type {
  Application,
  ApplicationPayload,
  ApplicationStatus,
  Company,
  Insights,
  Task
} from "../api/types";
import { useAuth } from "../features/auth/AuthContext";
import { ApplicationBoard } from "./ApplicationBoard";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationList } from "./ApplicationList";

const statusFilters: Array<ApplicationStatus | "ALL"> = [
  "ALL",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "TECHNICAL",
  "OFFER",
  "REJECTED"
];

export function Dashboard() {
  const { token, user, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [status, setStatus] = useState<ApplicationStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list">("list");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkspace = useCallback(async () => {
    if (!token) return;
    setError("");
    setIsLoading(true);

    try {
      const [applicationResult, companyResult, insightResult] = await Promise.all([
        api.applications(token, {
          status: viewMode === "board" || status === "ALL" ? undefined : status,
          search: search || undefined
        }),
        api.companies(token),
        api.insights(token)
      ]);
      setApplications(applicationResult.applications);
      setCompanies(companyResult.companies);
      setInsights(insightResult);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load workspace");
    } finally {
      setIsLoading(false);
    }
  }, [search, status, token, viewMode]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const funnel = useMemo(() => {
    const counts = new Map(
      insights?.counts.map((item) => [item.status, item._count.status] as const) ?? []
    );

    return [
      { label: "Saved", value: counts.get("SAVED") ?? 0 },
      { label: "Applied", value: counts.get("APPLIED") ?? 0 },
      { label: "Interview", value: counts.get("INTERVIEW") ?? 0 },
      { label: "Technical", value: counts.get("TECHNICAL") ?? 0 },
      { label: "Offer", value: counts.get("OFFER") ?? 0 }
    ];
  }, [insights]);

  async function createApplication(payload: ApplicationPayload) {
    if (!token) return;
    await api.createApplication(token, payload);
    await loadWorkspace();
  }

  async function updateStatus(application: Application, nextStatus: ApplicationStatus) {
    if (!token || application.status === nextStatus) return;
    await api.updateApplication(token, application.id, { status: nextStatus });
    await loadWorkspace();
  }

  async function deleteApplication(application: Application) {
    if (!token) return;
    await api.deleteApplication(token, application.id);
    await loadWorkspace();
  }

  async function addTask(application: Application, title: string) {
    if (!token) return;
    await api.createTask(token, application.id, { title });
    await loadWorkspace();
  }

  async function toggleTask(task: Task) {
    if (!token) return;
    await api.updateTask(token, task.id, { completed: !task.completed });
    await loadWorkspace();
  }

  return (
    <main className="dashboard-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="logo-mark compact">
            <BriefcaseBusiness size={20} />
          </span>
          <div>
            <p className="eyebrow">{user?.city ?? "Personal workspace"}</p>
            <h1>My Internship Tracker</h1>
          </div>
        </div>
        <div className="header-actions">
          <span>{user?.name}</span>
          <button className="icon-button" type="button" onClick={logout}>
            <LogOut size={18} />
            <span className="sr-only">Log out</span>
          </button>
        </div>
      </header>

      <section className="metric-grid" aria-label="Application metrics">
        <Metric icon={<Target size={20} />} label="Active" value={insights?.metrics.active ?? 0} />
        <Metric
          icon={<CalendarDays size={20} />}
          label="Interviews"
          value={insights?.metrics.interviews ?? 0}
        />
        <Metric icon={<Trophy size={20} />} label="Offers" value={insights?.metrics.offers ?? 0} />
        <Metric
          icon={<BriefcaseBusiness size={20} />}
          label="High priority"
          value={insights?.metrics.highPriority ?? 0}
        />
      </section>

      <section className="workspace-layout">
        <aside className="left-rail">
          <ApplicationForm companies={companies} onCreate={createApplication} />

          <section className="toolbar-panel" aria-label="Upcoming tasks">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Next moves</p>
                <h2>Upcoming</h2>
              </div>
              <CalendarDays size={20} />
            </div>
            <div className="upcoming-list">
              {insights?.upcomingTasks.length ? (
                insights.upcomingTasks.map((task) => (
                  <div className="upcoming-item" key={task.id}>
                    <strong>{task.title}</strong>
                    <span>
                      {task.application.company.name} - {formatDate(task.dueDate)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted">No dated tasks yet.</p>
              )}
            </div>
          </section>
        </aside>

        <section className="main-column">
          <div className="controls-row">
            <div className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles, companies, locations"
              />
            </div>
            <div className="view-toggle" aria-label="View mode">
              <button
                type="button"
                className={viewMode === "board" ? "active" : ""}
                onClick={() => {
                  setViewMode("board");
                  setStatus("ALL");
                }}
              >
                <Columns3 size={16} />
                Board
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
              >
                <List size={16} />
                List
              </button>
            </div>
            <div className="filter-tabs" aria-label="Status filter">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={status === filter ? "active" : ""}
                  onClick={() => setStatus(filter)}
                >
                  {filter === "ALL" ? "All" : labelStatus(filter)}
                </button>
              ))}
            </div>
          </div>

          <section className="funnel-panel" aria-label="Application funnel">
            {funnel.map((item) => (
              <div className="funnel-step" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </section>

          {error ? <p className="form-error">{error}</p> : null}
          {isLoading ? (
            <section className="loading-inline">
              <div className="spinner" aria-hidden="true" />
              <span>Refreshing tracker</span>
            </section>
          ) : viewMode === "board" ? (
            <ApplicationBoard
              applications={applications}
              onAddTask={addTask}
              onDelete={deleteApplication}
              onStatusChange={updateStatus}
            />
          ) : (
            <ApplicationList
              applications={applications}
              onStatusChange={updateStatus}
              onDelete={deleteApplication}
              onAddTask={addTask}
              onToggleTask={toggleTask}
            />
          )}
        </section>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="metric-card">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function labelStatus(status: ApplicationStatus) {
  return status[0] + status.slice(1).toLowerCase();
}
