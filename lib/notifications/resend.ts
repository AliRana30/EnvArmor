import { render } from "@react-email/render";
import { Resend } from "resend";
import { SecretDetectedEmail } from "@/app/emails/secret-detected";
import { GitHistoryLeakEmail } from "@/app/emails/git-history-leak";
import { RotationReminderEmail } from "@/app/emails/rotation-reminder";
import { WeeklyDigestEmail } from "@/app/emails/weekly-digest";
import { BreachAlertEmail } from "@/app/emails/breach-alert";

type SecretDetectedInput = {
  to: string;
  projectName: string;
  filePath: string;
  secretType: string;
  estimatedSavings: number;
};

type GitHistoryLeakInput = {
  to: string;
  projectName: string;
  filePath: string;
  secretType: string;
};

type RotationReminderInput = {
  to: string;
  secretType: string;
  ageInDays: number;
  projectName: string;
};

type WeeklyDigestInput = {
  to: string;
  blockedCount: number;
  projectCount: number;
  estimatedSavings: number;
  criticalCount: number;
};

type BreachAlertInput = {
  to: string;
  secretType: string;
  source: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM_ADDRESS || "alerts@envarmor.dev";

function getClient(): Resend {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }
  return new Resend(resendApiKey);
}

export async function sendSecretDetectedEmail(input: SecretDetectedInput): Promise<void> {
  const html = await render(
    SecretDetectedEmail({
      projectName: input.projectName,
      filePath: input.filePath,
      secretType: input.secretType,
      estimatedSavings: input.estimatedSavings
    })
  );

  await getClient().emails.send({
    from: fromAddress,
    to: [input.to],
    subject: `EnvArmor blocked a secret in ${input.projectName}`,
    html
  });
}

export async function sendGitHistoryLeakEmail(input: GitHistoryLeakInput): Promise<void> {
  const html = await render(
    GitHistoryLeakEmail({
      projectName: input.projectName,
      filePath: input.filePath,
      secretType: input.secretType
    })
  );

  await getClient().emails.send({
    from: fromAddress,
    to: [input.to],
    subject: "We found an old secret in your git history",
    html
  });
}

export async function sendRotationReminderEmail(input: RotationReminderInput): Promise<void> {
  const html = await render(
    RotationReminderEmail({
      secretType: input.secretType,
      ageInDays: input.ageInDays,
      projectName: input.projectName
    })
  );

  await getClient().emails.send({
    from: fromAddress,
    to: [input.to],
    subject: `Your ${input.secretType} is ${input.ageInDays} days old - time to rotate`,
    html
  });
}

export async function sendWeeklyDigestEmail(input: WeeklyDigestInput): Promise<void> {
  const html = await render(
    WeeklyDigestEmail({
      blockedCount: input.blockedCount,
      projectCount: input.projectCount,
      estimatedSavings: input.estimatedSavings,
      criticalCount: input.criticalCount
    })
  );

  await getClient().emails.send({
    from: fromAddress,
    to: [input.to],
    subject: "Your EnvArmor weekly report",
    html
  });
}

export async function sendBreachAlertEmail(input: BreachAlertInput): Promise<void> {
  const html = await render(
    BreachAlertEmail({
      secretType: input.secretType,
      source: input.source
    })
  );

  await getClient().emails.send({
    from: fromAddress,
    to: [input.to],
    subject: "A secret you use may have been compromised",
    html
  });
}
