import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicSiteStats } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'Your AI coding assistant is reading your .env file right now',
  description:
    'AI coding assistants can ingest local secret files through context indexing. Learn how to protect your env files in under 60 seconds.'
};

export const revalidate = 300;

export default async function AiEnvLeakBlogPage() {
  const stats = await getPublicSiteStats();

  return (
    <main className="min-h-screen bg-neo-bg bg-dots px-6 py-14 text-neo-ink">
      <article className="mx-auto max-w-4xl space-y-8 border-8 border-black bg-white p-6 shadow-neo-lg">
        <header className="space-y-3">
          <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-black shadow-neo-sm">EnvArmor Research</p>
          <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">Your AI coding assistant is reading your .env file right now</h1>
          <p className="max-w-3xl font-bold text-black">
            AI context indexing changed the threat model: secret leakage can happen before a commit, before review, and before anyone notices.
          </p>
        </header>

        <section className="space-y-3 text-black">
          <h2 className="text-2xl font-black text-black">What changed</h2>
          <p>
            Tools like Cursor, Claude Code, and Copilot can read broad workspace context by default. If ignore rules are missing,
            your env files, private keys, or local vault folders can be pulled into prompts and remote model requests.
          </p>
        </section>

        <section className="space-y-3 text-black">
          <h2 className="text-2xl font-black text-black">The fix</h2>
          <div className="border-4 border-black bg-black p-4 font-mono text-sm text-neo-secondary">
            npx envarmor init
            <br />
            npx envarmor protect
            <br />
            npx envarmor audit-ai
          </div>
          <p>
            EnvArmor adds safe defaults for .cursorignore, .claudeignore, Copilot instructions, and gitignore so your AI workflow
            stays productive without exposing credentials.
          </p>
        </section>

        <section className="border-8 border-black bg-neo-muted p-5 shadow-neo-sm">
          <h3 className="text-lg font-black text-black">Install in 60 seconds</h3>
          <p className="mt-2 font-bold text-black">Free forever for individual developers.</p>
          <p className="mt-4 font-bold text-black italic">"Save your $$ money and secrets before they leak."</p>
          <Link
            href="/"
            className="mt-5 inline-flex border-4 border-black bg-neo-accent px-4 py-2 text-sm font-black uppercase tracking-widest text-white shadow-neo-sm"
          >
            Scan my codebase free
          </Link>
        </section>
      </article>
    </main>
  );
}
