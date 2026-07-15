import { CalendarClock, ExternalLink, MapPin, Plus, Trash2 } from "lucide-react";
import type { Application, ApplicationStatus } from "../api/types";
import { statusLabel } from "./ApplicationForm";

type Props = {
  applications: Application[];
  onStatusChange: (application: Application, status: ApplicationStatus) => Promise<void>;
  onDelete: (application: Application) => Promise<void>;
  onAddTask: (application: Application, title: string) => Promise<void>;
};

const boardStatuses: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "TECHNICAL",
  "OFFER",
  "REJECTED",
  "ARCHIVED"
];

export function ApplicationBoard({
  applications,
  onStatusChange,
  onDelete,
  onAddTask
}: Props) {
  const groupedApplications = boardStatuses.map((status) => ({
    status,
    applications: applications.filter((application) => application.status === status)
  }));

  return (
    <section className="application-board" aria-label="Application pipeline board">
      {groupedApplications.map((group) => (
        <article className="board-column" key={group.status}>
          <header className="board-column-header">
            <h2>{statusLabel(group.status)}</h2>
            <span>{group.applications.length}</span>
          </header>

          <div className="board-column-body">
            {group.applications.length ? (
              group.applications.map((application) => (
                <BoardCard
                  application={application}
                  key={application.id}
                  onAddTask={onAddTask}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              ))
            ) : (
              <p className="board-empty">No roles yet</p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

function BoardCard({
  application,
  onStatusChange,
  onDelete,
  onAddTask
}: {
  application: Application;
  onStatusChange: (application: Application, status: ApplicationStatus) => Promise<void>;
  onDelete: (application: Application) => Promise<void>;
  onAddTask: (application: Application, title: string) => Promise<void>;
}) {
  const nextTask = application.tasks.find((task) => !task.completed);

  return (
    <div className={`board-card priority-${application.priority}`}>
      <div className="board-card-topline">
        <span>Priority {application.priority}</span>
        <div className="board-actions">
          {application.jobUrl ? (
            <a className="board-icon-button" href={application.jobUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              <span className="sr-only">Open job</span>
            </a>
          ) : null}
          <button className="board-icon-button danger" type="button" onClick={() => onDelete(application)}>
            <Trash2 size={15} />
            <span className="sr-only">Delete application</span>
          </button>
        </div>
      </div>

      <h3>{application.role}</h3>
      <p className="board-company">{application.company.name}</p>

      <div className="board-card-meta">
        <span>
          <MapPin size={13} />
          {application.company.location}
        </span>
        <span>
          <CalendarClock size={13} />
          {application.deadline ? formatShortDate(application.deadline) : "No deadline"}
        </span>
      </div>

      {nextTask ? (
        <div className="board-task">
          <Plus size={13} />
          {nextTask.title}
        </div>
      ) : (
        <button className="board-task muted-task" type="button" onClick={() => onAddTask(application, "Follow up")}>
          <Plus size={13} />
          Add follow-up
        </button>
      )}

      <label className="board-status-control">
        <span>Status</span>
        <select
          value={application.status}
          onChange={(event) => onStatusChange(application, event.target.value as ApplicationStatus)}
        >
          {boardStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
