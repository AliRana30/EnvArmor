import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text
} from "@react-email/components";

type WeeklyDigestEmailProps = {
  blockedCount: number;
  projectCount: number;
  estimatedSavings: number;
  criticalCount: number;
};

export function WeeklyDigestEmail({
  blockedCount,
  projectCount,
  estimatedSavings,
  criticalCount
}: WeeklyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your EnvArmor weekly report</Preview>
      <Body style={{ backgroundColor: "#020617", color: "#e2e8f0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <Container style={{ border: "1px solid #1e293b", borderRadius: "12px", padding: "24px", margin: "24px auto" }}>
          <Heading style={{ color: "#22c55e", fontSize: "22px" }}>Your EnvArmor weekly report</Heading>
          <Section style={{ backgroundColor: "#0f172a", borderRadius: "8px", padding: "14px" }}>
            <Text style={{ margin: "0 0 8px 0" }}><strong>Secrets blocked:</strong> {blockedCount}</Text>
            <Text style={{ margin: "0 0 8px 0" }}><strong>Projects active:</strong> {projectCount}</Text>
            <Text style={{ margin: "0 0 8px 0" }}><strong>Critical findings:</strong> {criticalCount}</Text>
            <Text style={{ margin: 0 }}><strong>Estimated savings:</strong> ${estimatedSavings.toFixed(2)}</Text>
          </Section>
          <Text style={{ color: "#94a3b8" }}>Keep your momentum and rotate long-lived credentials this week.</Text>
        </Container>
      </Body>
    </Html>
  );
}
