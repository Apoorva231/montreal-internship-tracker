import { ApplicationStatus, Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  applicationCreateSchema,
  applicationQuerySchema,
  applicationUpdateSchema
} from "../../validation/schemas.js";

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

const applicationInclude = {
  company: true,
  tasks: {
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.ApplicationInclude;

const inactiveStatuses = new Set<ApplicationStatus>([
  ApplicationStatus.REJECTED,
  ApplicationStatus.ARCHIVED
]);
const interviewStatuses = new Set<ApplicationStatus>([
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.TECHNICAL
]);
const submittedStatuses = new Set<ApplicationStatus>([
  ApplicationStatus.APPLIED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.TECHNICAL,
  ApplicationStatus.OFFER
]);

applicationsRouter.get("/insights", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const [counts, applications, upcomingTasks] = await Promise.all([
      prisma.application.groupBy({
        by: ["status"],
        where: { userId },
        _count: { status: true }
      }),
      prisma.application.findMany({
        where: { userId },
        include: { company: true },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.task.findMany({
        where: {
          completed: false,
          application: { userId },
          dueDate: { not: null }
        },
        include: {
          application: {
            include: { company: true }
          }
        },
        orderBy: { dueDate: "asc" },
        take: 5
      })
    ]);

    const total = applications.length;
    const active = applications.filter(
      (application) => !inactiveStatuses.has(application.status)
    ).length;
    const interviews = applications.filter((application) => interviewStatuses.has(application.status))
      .length;

    return res.json({
      counts,
      metrics: {
        total,
        active,
        interviews,
        offers: applications.filter((application) => application.status === ApplicationStatus.OFFER)
          .length,
        highPriority: applications.filter((application) => application.priority === 1).length
      },
      upcomingTasks
    });
  } catch (error) {
    return next(error);
  }
});

applicationsRouter.get("/", async (req, res, next) => {
  try {
    const query = applicationQuerySchema.parse(req.query);
    const where: Prisma.ApplicationWhereInput = {
      userId: req.user!.userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { role: { contains: query.search, mode: "insensitive" } },
              { company: { name: { contains: query.search, mode: "insensitive" } } },
              { company: { location: { contains: query.search, mode: "insensitive" } } }
            ]
          }
        : {})
    };

    const applications = await prisma.application.findMany({
      where,
      include: applicationInclude,
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
    });

    return res.json({ applications });
  } catch (error) {
    return next(error);
  }
});

applicationsRouter.get("/:id", async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId
      },
      include: applicationInclude
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json({ application });
  } catch (error) {
    return next(error);
  }
});

applicationsRouter.post("/", async (req, res, next) => {
  try {
    const input = applicationCreateSchema.parse(req.body);
    const companyId = await resolveCompanyId(input);
    const appliedAt =
      submittedStatuses.has(input.status)
        ? new Date()
        : null;

    const application = await prisma.application.create({
      data: {
        role: input.role,
        status: input.status,
        workMode: input.workMode,
        priority: input.priority,
        deadline: input.deadline ? new Date(input.deadline) : null,
        jobUrl: input.jobUrl,
        salaryRange: input.salaryRange,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        notes: input.notes,
        appliedAt,
        userId: req.user!.userId,
        companyId
      },
      include: applicationInclude
    });

    return res.status(201).json({ application });
  } catch (error) {
    return next(error);
  }
});

applicationsRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = applicationUpdateSchema.parse(req.body);
    const existing = await prisma.application.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId
      }
    });

    if (!existing) {
      return res.status(404).json({ message: "Application not found" });
    }

    const nextStatus = input.status ?? existing.status;
    const shouldSetAppliedAt =
      !existing.appliedAt && submittedStatuses.has(nextStatus);

    const application = await prisma.application.update({
      where: { id: existing.id },
      data: {
        ...(input.role ? { role: input.role } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.workMode ? { workMode: input.workMode } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.deadline !== undefined
          ? { deadline: input.deadline ? new Date(input.deadline) : null }
          : {}),
        ...(input.jobUrl !== undefined ? { jobUrl: input.jobUrl } : {}),
        ...(input.salaryRange !== undefined ? { salaryRange: input.salaryRange } : {}),
        ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
        ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(shouldSetAppliedAt ? { appliedAt: new Date() } : {}),
        ...(input.companyId || input.companyName
          ? { companyId: await resolveCompanyId(input) }
          : {})
      },
      include: applicationInclude
    });

    return res.json({ application });
  } catch (error) {
    return next(error);
  }
});

applicationsRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.application.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId
      }
    });

    if (!existing) {
      return res.status(404).json({ message: "Application not found" });
    }

    await prisma.application.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

async function resolveCompanyId(input: {
  companyId?: string;
  companyName?: string;
  companyLocation?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
}) {
  if (input.companyId) {
    return input.companyId;
  }

  const company = await prisma.company.upsert({
    where: {
      name_location: {
        name: input.companyName!,
        location: input.companyLocation ?? "Montreal, QC"
      }
    },
    update: {
      website: input.companyWebsite,
      industry: input.companyIndustry ?? "Technology",
      size: input.companySize
    },
    create: {
      name: input.companyName!,
      location: input.companyLocation ?? "Montreal, QC",
      website: input.companyWebsite,
      industry: input.companyIndustry ?? "Technology",
      size: input.companySize
    }
  });

  return company.id;
}
