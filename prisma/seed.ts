import { PrismaClient, Severity } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  const demoEmail = "demo@envarmor.dev";

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Demo Developer",
      avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=EnvArmor",
      apiKey: randomBytes(16).toString("hex")
    }
  });

  const projectNames = ["Frontend App", "Payments API", "Worker Queue"];

  const projects = [];
  for (const name of projectNames) {
    const slug = slugify(name);
    const project = await prisma.project.upsert({
      where: {
        userId_slug: {
          userId: user.id,
          slug
        }
      },
      update: {},
      create: {
        userId: user.id,
        name,
        slug,
        description: `${name} for EnvArmor demo workspace`
      }
    });
    projects.push(project);
  }

  const demoEvents = [
    {
      projectId: projects[0].id,
      secretType: "AWS_KEY",
      severity: Severity.HIGH,
      filePath: "src/config/aws.ts",
      lineNumber: 8,
      blocked: true,
      estimatedCostSaved: 180
    },
    {
      projectId: projects[0].id,
      secretType: "STRIPE_SECRET",
      severity: Severity.CRITICAL,
      filePath: "src/lib/billing.ts",
      lineNumber: 14,
      blocked: true,
      estimatedCostSaved: 420
    },
    {
      projectId: projects[1].id,
      secretType: "DB_URI",
      severity: Severity.HIGH,
      filePath: "services/db/connection.ts",
      lineNumber: 3,
      blocked: false,
      estimatedCostSaved: 95
    },
    {
      projectId: projects[2].id,
      secretType: "SENDGRID_KEY",
      severity: Severity.MEDIUM,
      filePath: "workers/email.ts",
      lineNumber: 22,
      blocked: true,
      estimatedCostSaved: 70
    },
    {
      projectId: projects[2].id,
      secretType: "JWT_SECRET",
      severity: Severity.HIGH,
      filePath: "workers/auth.ts",
      lineNumber: 11,
      blocked: true,
      estimatedCostSaved: 130
    }
  ];

  for (const event of demoEvents) {
    await prisma.scanEvent.create({
      data: {
        userId: user.id,
        projectId: event.projectId,
        secretType: event.secretType,
        severity: event.severity,
        filePath: event.filePath,
        lineNumber: event.lineNumber,
        blocked: event.blocked,
        estimatedCostSaved: event.estimatedCostSaved
      }
    });
  }

  console.log("Seed complete:", {
    user: user.email,
    projects: projects.length,
    scanEvents: demoEvents.length
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });