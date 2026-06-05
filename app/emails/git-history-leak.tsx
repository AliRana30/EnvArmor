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

type GitHistoryLeakEmailProps = {
  projectName: string;
  filePath: string;
  secretType: string;
};

export function GitHistoryLeakEmail({ projectName, filePath, secretType }: GitHistoryLeakEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>We found an old secret in your git history</Preview>
      <Body style={{ backgroundColor: "#020617", color: "#e2e8f0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <Container style={{ border: "1px solid #7f1d1d", borderRadius: "12px", padding: "24px", margin: "24px auto" }}>
          <Heading style={{ color: "#fb7185", fontSize: "22px" }}>We found an old secret in your git history</Heading>
          <Text><strong>Project:</strong> {projectName}</Text>
          <Text><strong>File:</strong> {filePath}</Text>
          <Text><strong>Type:</strong> {secretType}</Text>
          <Section style={{ backgroundColor: "#0f172a", borderRadius: "8px", padding: "14px" }}>
            <Text style={{ marginTop: 0 }}><strong>Recommended remediation</strong></Text>
            <Text style={{ margin: "6px 0" }}>1. Rotate the exposed credential immediately.</Text>
            <Text style={{ margin: "6px 0" }}>2. Rewrite git history with a cleanup tool (for example, git filter-repo).</Text>
            <Text style={{ margin: "6px 0" }}>3. Force-push cleaned history and notify your team.</Text>
            <Text style={{ margin: "6px 0" }}>4. Run envarmor protect to reduce future accidental exposure.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
