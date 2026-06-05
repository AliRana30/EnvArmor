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

type RotationReminderEmailProps = {
  secretType: string;
  ageInDays: number;
  projectName: string;
};

export function RotationReminderEmail({ secretType, ageInDays, projectName }: RotationReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your ${secretType} is ${ageInDays} days old - time to rotate`}</Preview>
      <Body style={{ backgroundColor: "#020617", color: "#e2e8f0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <Container style={{ border: "1px solid #1e293b", borderRadius: "12px", padding: "24px", margin: "24px auto" }}>
          <Heading style={{ color: "#f59e0b", fontSize: "22px" }}>Rotation reminder</Heading>
          <Text>Your {secretType} in <strong>{projectName}</strong> is {ageInDays} days old.</Text>
          <Section style={{ backgroundColor: "#0f172a", borderRadius: "8px", padding: "14px" }}>
            <Text style={{ margin: 0 }}>Rotate this credential now and update your vault to reduce breach risk.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
