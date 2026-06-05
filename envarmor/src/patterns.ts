export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PatternDefinition = {
  type: string;
  regex: RegExp;
  severity: Severity;
};

export interface RiskEstimate {
  low: number;
  high: number;
  basis: string;
}

export function getRiskEstimate(type: string): RiskEstimate {
  const t = type.toUpperCase();
  
  if (t === "ENV_CONFIG" || t.includes("LOW") || t === "PORT" || t === "NODE_ENV") {
    return { low: 0, high: 0, basis: "General public configuration" };
  }
  if (t.includes("AWS") || t.includes("CLOUD")) {
    return { low: 50, high: 5000, basis: "Compute/S3 abuse, unexpected billing" };
  }
  if (t.includes("STRIPE_SECRET") || t.includes("PAYMENT")) {
    return { low: 100, high: 10000, basis: "Unauthorized charges, chargebacks" };
  }
  if (t.includes("STRIPE_PUBLISHABLE") || t.includes("PUBLISHABLE")) {
    return { low: 0, high: 20, basis: "Client-side key, limited blast radius" };
  }
  if (t.includes("OPENAI") || t.includes("AI_API") || t.includes("ANTHROPIC") || t.includes("GEMINI") || t.includes("MISTRAL") || t.includes("DEEPSEEK")) {
    return { low: 10, high: 1000, basis: "Token consumption abuse" };
  }
  if (t.includes("GITHUB_TOKEN") || t === "GITHUB_TOKEN") {
    return { low: 0, high: 500, basis: "Repo access, CI abuse" };
  }
  if (t.includes("GITHUB_PAT") || t === "GITHUB_PAT") {
    return { low: 50, high: 2000, basis: "Full account access scope" };
  }
  if (t.includes("DATABASE") || t.includes("POSTGRES") || t.includes("MYSQL") || t.includes("MONGO") || t.includes("REDIS")) {
    return { low: 500, high: 50000, basis: "Data breach, regulatory fines" };
  }
  if (t.includes("JWT") || t.includes("AUTH") || t.includes("SUPABASE") || t.includes("CLERK") || t.includes("APP_SECRET")) {
    return { low: 200, high: 5000, basis: "Auth bypass, session forgery" };
  }
  if (t.includes("SENDGRID") || t.includes("EMAIL") || t.includes("SMTP") || t.includes("MAIL")) {
    return { low: 5, high: 200, basis: "Email spam abuse" };
  }
  if (t.includes("TWILIO") || t.includes("NOTIFICATION")) {
    return { low: 10, high: 500, basis: "SMS/call billing fraud" };
  }
  if (t.includes("FIREBASE")) {
    return { low: 20, high: 1500, basis: "Database and auth access" };
  }
  if (t.includes("GOOGLE") || t.includes("OAUTH")) {
    return { low: 10, high: 1000, basis: "OAuth impersonation" };
  }
  if (t.includes("SECURITY")) {
    return { low: 100, high: 5000, basis: "Security/cryptographic bypass" };
  }
  if (t.includes("SERVICE") || t.includes("CMS") || t.includes("MONITORING")) {
    return { low: 0, high: 50, basis: "CMS/monitoring metadata leakage" };
  }
  
  return { low: 0, high: 100, basis: "Unclassified configuration parameter" };
}

export const STATIC_PATTERNS: PatternDefinition[] = [
  {
    type: "AWS_ACCESS_KEY",
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: "HIGH"
  },
  {
    type: "STRIPE_SECRET",
    regex: /sk_(live|test)_[a-zA-Z0-9]{24,}/g,
    severity: "CRITICAL"
  },
  {
    type: "STRIPE_PUBLISHABLE",
    regex: /pk_(live|test)_[a-zA-Z0-9]{24,}/g,
    severity: "MEDIUM"
  },
  {
    type: "GITHUB_TOKEN",
    regex: /ghp_[a-zA-Z0-9]{36}/g,
    severity: "CRITICAL"
  },
  {
    type: "DATABASE_URL",
    regex: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/g,
    severity: "HIGH"
  },
  {
    type: "SENDGRID_KEY",
    regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    severity: "HIGH"
  },
  {
    type: "TWILIO_TOKEN",
    regex: /SK[a-fA-F0-9]{32}/g,
    severity: "HIGH"
  },
  {
    type: "OPENAI_KEY",
    regex: /sk-[a-zA-Z0-9]{48}/g,
    severity: "HIGH"
  },
  {
    type: "AWS_SECRET_KEY",
    regex: /(?<![A-Za-z0-9])(?:aws_secret|AWS_SECRET_ACCESS_KEY)[\s:=]+["'`]?[A-Za-z0-9/+=]{40}["'`]?(?![A-Za-z0-9])/g,
    severity: "CRITICAL"
  },
  {
    type: "ANTHROPIC_KEY",
    regex: /sk-ant-[a-zA-Z0-9_-]{95}/g,
    severity: "HIGH"
  },
  {
    type: "SUPABASE_KEY",
    regex: /eyJ[a-zA-Z0-9_-]{100,}/g,
    severity: "HIGH"
  }
];

// =========================
// ENV KEY PATTERNS (Cost Estimation)
// =========================

export const ENV_KEY_PATTERNS: PatternDefinition[] = [
  // DATABASES ($5000 - $500000)
  {
    type: "DATABASE_CREDENTIALS",
    regex: /\b(?:DATABASE|POSTGRES|MYSQL|MONGO|REDIS|TURSO|UPSTASH)_(?:URL|PASSWORD|TOKEN|URI|HOST|PRISMA_URL)\b/gi,
    severity: "HIGH"
  },
  // AUTHENTICATION ($2000 - $50000)
  {
    type: "AUTH_SECRET",
    regex: /\b(?:NEXTAUTH|AUTH|JWT|ACCESS|REFRESH|SESSION|COOKIE|CLERK|SUPABASE|FIREBASE)_(?:SECRET|KEY|TOKEN|URL|ANON_KEY|ROLE_KEY|API_KEY)\b/gi,
    severity: "CRITICAL"
  },
  // OAUTH CLIENTS ($100 - $10000)
  {
    type: "OAUTH_CREDENTIALS",
    regex: /\b(?:GOOGLE|GITHUB|FACEBOOK|DISCORD|TWITTER|LINKEDIN|APPLE|MICROSOFT|AZURE)_(?:CLIENT_ID|CLIENT_SECRET)\b/gi,
    severity: "HIGH"
  },
  // PAYMENT GATEWAYS ($1000 - $100000)
  {
    type: "PAYMENT_SECRET",
    regex: /\b(?:STRIPE|PAYPAL|RAZORPAY|PADDLE|LEMONSQUEEZY|BRAINTREE|COINBASE|XPAY|POSTEX|JAZZCASH|EASYPAISA)_(?:SECRET|KEY|PRIVATE|API_KEY|TOKEN)\b/gi,
    severity: "CRITICAL"
  },
  // CLOUD / STORAGE ($500 - $50000)
  {
    type: "CLOUD_CREDENTIALS",
    regex: /\b(?:AWS|CLOUDFLARE|CLOUDINARY|VERCEL|NETLIFY|DIGITALOCEAN|AZURE|GCP)_(?:ACCESS|SECRET|TOKEN|ID|KEY|CONNECTION)\b/gi,
    severity: "CRITICAL"
  },
  // AI / LLM ($100 - $10000)
  {
    type: "AI_API_KEY",
    regex: /\b(?:OPENAI|ANTHROPIC|GEMINI|MISTRAL|GROQ|TOGETHER|DEEPSEEK|HUGGINGFACE|COHERE|PERPLEXITY|XAI|PINECONE|WEAVIATE)_(?:API_KEY|TOKEN|ID|ORG_ID)\b/gi,
    severity: "HIGH"
  },
  // EMAIL / SMTP ($50 - $2000)
  {
    type: "EMAIL_CREDENTIALS",
    regex: /\b(?:SMTP|MAIL|SENDGRID|MAILGUN|POSTMARK|RESEND|BREVO)_(?:PASSWORD|KEY|TOKEN|HOST|USER)\b/gi,
    severity: "MEDIUM"
  },
  // SECURITY / WEB3
  {
    type: "SECURITY_SECRET",
    regex: /\b(?:VAULT|SIEM|WAF|HMAC|SIGNING|PRIVATE|SSH|ALCHEMY|INFURA|MORALIS|WALLET)_(?:TOKEN|KEY|ADDR|SECRET|PRIVATE_KEY)\b/gi,
    severity: "CRITICAL"
  },
  // CMS / ANALYTICS
  {
    type: "SERVICE_CONFIG",
    regex: /\b(?:SANITY|CONTENTFUL|STRAPI|HYGRAPH|WORDPRESS|SENTRY|LOGTAIL|DATADOG|MIXPANEL|AMPLITUDE|POSTHOG|GA|HOTJAR)_(?:ID|KEY|TOKEN|DSN|PROJECT_ID)\b/gi,
    severity: "MEDIUM"
  },
  // REALTIME / NOTIFICATIONS
  {
    type: "NOTIFICATION_SECRET",
    regex: /\b(?:PUSHER|ABLY|TWILIO|VONAGE|SLACK|TELEGRAM|DISCORD)_(?:SECRET|KEY|TOKEN|SID|SIGNING)\b/gi,
    severity: "HIGH"
  },
  // CUSTOM / APP SECRETS
  {
    type: "APP_SECRET",
    regex: /\b(?:APP|BASE|API|CLIENT|SERVER|SECRET|JWT|SESSION|COOKIE|ENCRYPTION|AES|HASH|CRON|WEBHOOK|ENVARMOR)_(?:SECRET|KEY|TOKEN)\b/gi,
    severity: "HIGH"
  },
  // GENERAL CONFIG (LOW RISK)
  {
    type: "ENV_CONFIG",
    regex: /\b(?:NODE_ENV|PORT|HOST|APP_NAME|APP_URL|BASE_URL|API_URL|PUBLIC_URL|FRONTEND_URL|BACKEND_URL|NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_API_URL|CLIENT_URL|SERVER_URL|DEBUG|LOG_LEVEL|MAX_FILE_SIZE|UPLOAD_DIR)\b/gi,
    severity: "LOW"
  }
];

export const CONTEXTUAL_PATTERNS = {
  awsSecret: {
    type: "AWS_SECRET_KEY",
    contextRegex: /aws_secret|awsSecret|AWS_SECRET_ACCESS_KEY/i,
    valueRegex: /["'`]([A-Za-z0-9/+=]{40})["'`]/,
    severity: "CRITICAL" as const
  },
  jwtSecret: {
    type: "JWT_SECRET",
    contextRegex: /JWT_SECRET\s*=|jwtSecret\s*=|jwt_secret\s*=/i,
    valueRegex: /["'`]([A-Za-z0-9+/_=-]{24,})["'`]/,
    severity: "HIGH" as const
  }
};
