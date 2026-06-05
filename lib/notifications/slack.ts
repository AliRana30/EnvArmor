type SlackSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const severityEmoji: Record<SlackSeverity, string> = {
  LOW: ":large_green_circle:",
  MEDIUM: ":large_yellow_circle:",
  HIGH: ":large_orange_circle:",
  CRITICAL: ":red_circle:"
};

type SlackDetectionPayload = {
  webhookUrl: string;
  projectName: string;
  secretType: string;
  severity: SlackSeverity;
  filePath: string;
  estimatedSavings: number;
};

export async function sendSlackDetectionAlert(payload: SlackDetectionPayload): Promise<void> {
  const text = [
    `${severityEmoji[payload.severity]} *EnvArmor detected a secret*`,
    `*Project:* ${payload.projectName}`,
    `*Type:* ${payload.secretType}`,
    `*Severity:* ${payload.severity}`,
    `*File:* ${payload.filePath}`,
    `*Estimated savings:* $${payload.estimatedSavings.toFixed(2)}`
  ].join("\n");

  const response = await fetch(payload.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }
}
