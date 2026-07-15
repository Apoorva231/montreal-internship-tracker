import bcrypt from "bcryptjs";
import { PrismaClient, ApplicationStatus, WorkMode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("DemoPassword123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@interntracker.dev" },
    update: {},
    create: {
      email: "demo@interntracker.dev",
      name: "Demo Candidate",
      passwordHash,
      city: "Montreal, QC"
    }
  });

  const companies = await Promise.all(
    [
      {
        name: "Shopify",
        location: "Ottawa, ON / Remote Canada",
        website: "https://www.shopify.com/careers",
        industry: "Commerce platform",
        size: "10000+"
      },
      {
        name: "Dialogue",
        location: "Montreal, QC",
        website: "https://www.dialogue.co/careers",
        industry: "Health technology",
        size: "500-1000"
      },
      {
        name: "Lightspeed",
        location: "Montreal, QC",
        website: "https://www.lightspeedhq.com/careers/",
        industry: "Retail and restaurant software",
        size: "1000-5000"
      }
    ].map((company) =>
      prisma.company.upsert({
        where: {
          name_location: {
            name: company.name,
            location: company.location
          }
        },
        update: company,
        create: company
      })
    )
  );

  const existingApplications = await prisma.application.count({
    where: { userId: user.id }
  });

  if (existingApplications === 0) {
    await prisma.application.createMany({
      data: [
        {
          role: "Backend Engineering Intern",
          status: ApplicationStatus.APPLIED,
          workMode: WorkMode.HYBRID,
          priority: 1,
          deadline: new Date("2026-09-30T04:00:00.000Z"),
          jobUrl: "https://www.shopify.com/careers",
          salaryRange: "CAD 32-45/hr",
          notes: "Highlight Node, TypeScript, Prisma, and API design.",
          userId: user.id,
          companyId: companies[0].id,
          appliedAt: new Date()
        },
        {
          role: "Full Stack Intern",
          status: ApplicationStatus.INTERVIEW,
          workMode: WorkMode.HYBRID,
          priority: 1,
          deadline: new Date("2026-08-20T04:00:00.000Z"),
          jobUrl: "https://www.dialogue.co/careers",
          notes: "Prepare one health-tech product question.",
          userId: user.id,
          companyId: companies[1].id,
          appliedAt: new Date()
        },
        {
          role: "Software Developer Intern",
          status: ApplicationStatus.SAVED,
          workMode: WorkMode.ONSITE,
          priority: 2,
          deadline: new Date("2026-10-15T04:00:00.000Z"),
          jobUrl: "https://www.lightspeedhq.com/careers/",
          notes: "Customize resume around POS and commerce systems.",
          userId: user.id,
          companyId: companies[2].id
        }
      ]
    });

    const applications = await prisma.application.findMany({
      where: { userId: user.id }
    });

    await prisma.task.createMany({
      data: applications.flatMap((application) => [
        {
          title: "Tailor resume bullets",
          applicationId: application.id,
          dueDate: application.deadline
            ? new Date(application.deadline.getTime() - 7 * 24 * 60 * 60 * 1000)
            : null
        },
        {
          title: "Send follow-up",
          applicationId: application.id,
          dueDate: application.appliedAt
            ? new Date(application.appliedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
            : null
        }
      ])
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

