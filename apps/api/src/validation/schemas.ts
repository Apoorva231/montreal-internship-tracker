import { ApplicationStatus, WorkMode } from "@prisma/client";
import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalEmail = z
  .string()
  .trim()
  .email()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[0-9]/, "Password needs a number")
  .regex(/[^A-Za-z0-9]/, "Password needs a symbol");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

const applicationBaseSchema = z.object({
    role: z.string().trim().min(2).max(120),
    companyId: z.string().cuid().optional(),
    companyName: z.string().trim().min(2).max(120).optional(),
    companyLocation: z.string().trim().min(2).max(120).default("Montreal, QC"),
    companyWebsite: optionalUrl,
    companyIndustry: z.string().trim().min(2).max(80).default("Technology"),
    companySize: z.string().trim().max(40).optional(),
    status: z.nativeEnum(ApplicationStatus).default(ApplicationStatus.SAVED),
    workMode: z.nativeEnum(WorkMode).default(WorkMode.HYBRID),
    priority: z.coerce.number().int().min(1).max(3).default(2),
    deadline: z.string().datetime().optional().nullable(),
    jobUrl: optionalUrl,
    salaryRange: z.string().trim().max(80).optional(),
    contactName: z.string().trim().max(80).optional(),
    contactEmail: optionalEmail,
    notes: z.string().trim().max(2000).optional()
  });

export const applicationCreateSchema = applicationBaseSchema
  .refine((value) => value.companyId || value.companyName, {
    message: "Choose an existing company or enter a new company name",
    path: ["companyName"]
  });

export const applicationUpdateSchema = applicationBaseSchema.partial();

export const applicationQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  search: z.string().trim().max(120).optional()
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(140),
  dueDate: z.string().datetime().optional().nullable()
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(2).max(140).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  completed: z.boolean().optional()
});
