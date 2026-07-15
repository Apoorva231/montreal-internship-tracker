import { FormEvent, useState } from "react";
import {
  CalendarClock,
  Check,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Plus,
  Trash2
} from "lucide-react";
import type { Application, ApplicationStatus, Task } from "../api/types";
import { modeLabel, statusLabel } from "./ApplicationForm";

type Props = {
  applications: Application[];
  onStatusChange: (application: Application, status: ApplicationStatus) => Promise<void>;
  onDelete: (application: Application) => Promise<void>;
  onAddTask: (application: Application, title: string) => Promise<void>;
  onToggleTask: (task: Task) => Promise<void>;
};

const statuses: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "TECHNICAL",
  "OFFER",
  "REJECTED",
  "ARCHIVED"
];

export function ApplicationList({
  applications,
  onStatusChange,
  onDelete,
  onAddTask,
  onToggleTask
}: Props) {
  if (applications.length === 0) {
    return (
      <section className="empty-state">
        <MoreHorizontal size={26} />
        <h2>No applications match this view.</h2>
        <p>Add a target or adjust your filters.</p>
      </section>
    );
  }

  return (
    <section className="application-list" aria-label="Applications">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
        />
      ))}
    </section>
  );
}

type ApplicationCardProps = Omit<Props, "applications"> & {
  application: Application;
};

function ApplicationCard({
  application,
  onStatusChange,
  onDelete,
  onAddTask,
  onToggleTask
}: ApplicationCardProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const dueDate = application.deadline ? formatDate(application.deadline) : "No deadline";

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    await onAddTask(application, taskTitle.trim());
    setTaskTitle("");
  }

  return (
    <article className={`application-card priority-${application.priority}`}>
      <div className="application-main">
        <div>
          <div className="status-line">
            <span className={`status-pill ${application.status.toLowerCase()}`}>
              {statusLabel(application.status)}
            </span>
            <span className="work-mode">{modeLabel(application.workMode)}</span>
          </div>
          <h2>{application.role}</h2>
          <div className="company-line">
            <strong>{application.company.name}</strong>
            <span>
              <MapPin size={14} />
              {application.company.location}
            </span>
          </div>
        </div>
        <div className="card-actions">
          {application.jobUrl ? (
            <a className="icon-button" href={application.jobUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} />
              <span className="sr-only">Open job</span>
            </a>
          ) : null}
          <button className="icon-button danger" type="button" onClick={() => onDelete(application)}>
            <Trash2 size={17} />
            <span className="sr-only">Delete application</span>
          </button>
        </div>
      </div>

      <div className="application-meta">
        <span>
          <CalendarClock size={15} />
          {dueDate}
        </span>
        <span>Priority {application.priority}</span>
        {application.salaryRange ? <span>{application.salaryRange}</span> : null}
      </div>

      {application.notes ? <p className="notes">{application.notes}</p> : null}

      <div className="status-selector" aria-label="Application status">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            className={application.status === status ? "active" : ""}
            onClick={() => onStatusChange(application, status)}
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <div className="task-strip">
        <div className="task-list">
          {application.tasks.slice(0, 3).map((task) => (
            <button
              key={task.id}
              type="button"
              className={`task-chip ${task.completed ? "done" : ""}`}
              onClick={() => onToggleTask(task)}
            >
              <Check size={14} />
              {task.title}
            </button>
          ))}
        </div>
        <form className="task-form" onSubmit={handleTaskSubmit}>
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Add follow-up"
          />
          <button className="icon-button" type="submit">
            <Plus size={16} />
            <span className="sr-only">Add task</span>
          </button>
        </form>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
