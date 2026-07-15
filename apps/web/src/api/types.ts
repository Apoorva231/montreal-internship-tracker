export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "INTERVIEW"
  | "TECHNICAL"
  | "OFFER"
  | "REJECTED"
  | "ARCHIVED";

export type WorkMode = "REMOTE" | "HYBRID" | "ONSITE";

export type User = {
  id: string;
  name: string;
  email: string;
  city: string;
};

export type Company = {
  id: string;
  name: string;
  location: string;
  website?: string | null;
  industry: string;
  size?: string | null;
};

export type Task = {
  id: string;
  title: string;
  dueDate?: string | null;
  completed: boolean;
};

export type Application = {
  id: string;
  role: string;
  status: ApplicationStatus;
  workMode: WorkMode;
  priority: number;
  deadline?: string | null;
  jobUrl?: string | null;
  salaryRange?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  appliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company: Company;
  tasks: Task[];
};

export type Insights = {
  counts: Array<{
    status: ApplicationStatus;
    _count: {
      status: number;
    };
  }>;
  metrics: {
    total: number;
    active: number;
    interviews: number;
    offers: number;
    highPriority: number;
  };
  upcomingTasks: Array<
    Task & {
      application: Application;
    }
  >;
};

export type ApplicationPayload = {
  role: string;
  companyId?: string;
  companyName?: string;
  companyLocation?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
  status: ApplicationStatus;
  workMode: WorkMode;
  priority: number;
  deadline?: string | null;
  jobUrl?: string;
  salaryRange?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
};

