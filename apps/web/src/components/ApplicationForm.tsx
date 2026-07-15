import { FormEvent, useMemo, useState } from "react";
import { Building2, Plus, Save } from "lucide-react";
import type { ApplicationPayload, ApplicationStatus, Company, WorkMode } from "../api/types";

const statuses: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "TECHNICAL",
  "OFFER",
  "REJECTED",
  "ARCHIVED"
];

const workModes: WorkMode[] = ["REMOTE", "HYBRID", "ONSITE"];

type Props = {
  companies: Company[];
  onCreate: (payload: ApplicationPayload) => Promise<void>;
};

const initialState: ApplicationPayload = {
  role: "",
  companyName: "",
  companyLocation: "Montreal, QC",
  companyIndustry: "Technology",
  status: "SAVED",
  workMode: "HYBRID",
  priority: 2,
  deadline: "",
  jobUrl: "",
  salaryRange: "",
  contactName: "",
  contactEmail: "",
  notes: ""
};

export function ApplicationForm({ companies, onCreate }: Props) {
  const [values, setValues] = useState<ApplicationPayload>(initialState);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  function updateValue<Key extends keyof ApplicationPayload>(
    key: Key,
    value: ApplicationPayload[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload: ApplicationPayload = {
        ...values,
        companyId: selectedCompanyId || undefined,
        companyName: selectedCompanyId ? undefined : values.companyName,
        companyLocation: selectedCompany?.location ?? values.companyLocation,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null
      };

      await onCreate(payload);
      setValues(initialState);
      setSelectedCompanyId("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create application");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="toolbar-panel" aria-label="Create application">
      <div className="section-heading">
        <div>
          <p className="eyebrow">New target</p>
          <h2>Add internship</h2>
        </div>
        <Building2 size={20} />
      </div>

      <form className="application-form" onSubmit={handleSubmit}>
        <label>
          <span>Role</span>
          <input
            required
            value={values.role}
            onChange={(event) => updateValue("role", event.target.value)}
            placeholder="Software Engineer Intern"
          />
        </label>

        <label>
          <span>Company</span>
          <select
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
          >
            <option value="">New company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} - {company.location}
              </option>
            ))}
          </select>
        </label>

        {!selectedCompanyId ? (
          <>
            <label>
              <span>Company name</span>
              <input
                required
                value={values.companyName}
                onChange={(event) => updateValue("companyName", event.target.value)}
                placeholder="Lightspeed"
              />
            </label>
            <label>
              <span>Location</span>
              <input
                value={values.companyLocation}
                onChange={(event) => updateValue("companyLocation", event.target.value)}
              />
            </label>
          </>
        ) : null}

        <div className="form-row">
          <label>
            <span>Status</span>
            <select
              value={values.status}
              onChange={(event) => updateValue("status", event.target.value as ApplicationStatus)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Mode</span>
            <select
              value={values.workMode}
              onChange={(event) => updateValue("workMode", event.target.value as WorkMode)}
            >
              {workModes.map((mode) => (
                <option key={mode} value={mode}>
                  {modeLabel(mode)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            <span>Priority</span>
            <select
              value={values.priority}
              onChange={(event) => updateValue("priority", Number(event.target.value))}
            >
              <option value={1}>High</option>
              <option value={2}>Medium</option>
              <option value={3}>Low</option>
            </select>
          </label>
          <label>
            <span>Deadline</span>
            <input
              type="date"
              value={values.deadline ?? ""}
              onChange={(event) => updateValue("deadline", event.target.value)}
            />
          </label>
        </div>

        <label>
          <span>Job URL</span>
          <input
            value={values.jobUrl}
            onChange={(event) => updateValue("jobUrl", event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label>
          <span>Notes</span>
          <textarea
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            placeholder="Resume angle, recruiter notes, interview prep"
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Save size={18} /> : <Plus size={18} />}
          {isSubmitting ? "Saving" : "Add application"}
        </button>
      </form>
    </section>
  );
}

export function statusLabel(status: ApplicationStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function modeLabel(mode: WorkMode) {
  return mode[0] + mode.slice(1).toLowerCase();
}

