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

type BreachAlertEmailProps = {
  secretType: string;
  source: string;
};

export function BreachAlertEmail({ secretType, source }: BreachAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>A secret you use may have been compromised</Preview>
      <Body style={{ backgroundColor: "#020617", color: "#e2e8f0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <Container style={{ border: "1px solid #7f1d1d", borderRadius: "12px", padding: "24px", margin: "24px auto" }}>
          <Heading style={{ color: "#fb7185", fontSize: "22px" }}>Breach alert</Heading>
          <Text>A credential class you use was flagged in public breach data.</Text>
          <Section style={{ backgroundColor: "#0f172a", borderRadius: "8px", padding: "14px" }}>
            <Text style={{ margin: "0 0 8px 0" }}><strong>Secret type:</strong> {secretType}</Text>
            <Text style={{ margin: 0 }}><strong>Breach source:</strong> {source}</Text>
          </Section>
          <Text style={{ color: "#94a3b8" }}>Rotate related credentials immediately and review access logs.</Text>
        </Container>
      </Body>
    </Html>
  );
}
