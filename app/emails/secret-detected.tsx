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

type SecretDetectedEmailProps = {
  projectName: string;
  filePath: string;
  secretType: string;
  estimatedSavings: number;
};

export function SecretDetectedEmail({
  projectName,
  filePath,
  secretType,
  estimatedSavings
}: SecretDetectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>EnvArmor blocked a secret in {projectName}</Preview>
      <Body style={{ backgroundColor: "#020617", color: "#e2e8f0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <Container style={{ border: "1px solid #1e293b", borderRadius: "12px", padding: "24px", margin: "24px auto" }}>
          <Heading style={{ color: "#22c55e", fontSize: "22px" }}>EnvArmor blocked a secret in {projectName}</Heading>
          <Text>A potential secret was blocked before it could leak.</Text>
          <Section style={{ backgroundColor: "#0f172a", borderRadius: "8px", padding: "14px" }}>
            <Text style={{ margin: 0 }}><strong>File:</strong> {filePath}</Text>
            <Text style={{ margin: "8px 0 0 0" }}><strong>Type:</strong> {secretType}</Text>
            <Text style={{ margin: "8px 0 0 0" }}><strong>Estimated savings:</strong> ${estimatedSavings.toFixed(2)}</Text>
          </Section>
          <Text style={{ color: "#94a3b8" }}>You can review this event in your dashboard scan history.</Text>
        </Container>
      </Body>
    </Html>
  );
}
