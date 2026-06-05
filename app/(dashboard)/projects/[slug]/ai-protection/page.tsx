import Link from 'next/link';

export default async function AiProtectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="space-y-6 bg-neo-bg bg-dots p-6 text-neo-ink">
      <div className="border-8 border-black bg-white p-5 shadow-neo-lg">
        <p className="mb-3 inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">
          AI Protection
        </p>
        <h1 className="text-3xl font-black text-black">Project: {slug}</h1>
        <p className="mt-1 font-bold text-black">AI context guard for repo.</p>
      </div>

      <section className="border-8 border-black bg-white p-5 shadow-neo-lg">
        <h2 className="text-xl font-black text-black">Status overview</h2>
        <p className="mt-2 font-bold text-black">Cursor: Unprotected</p>
        <p className="font-bold text-black">Claude Code: Unprotected</p>
        <p className="font-bold text-black">GitHub Copilot: Protected</p>

        <div className="mt-4 border-4 border-black bg-black p-3 font-mono text-xs text-neo-secondary">
          <p>Run this in your project:</p>
          <p className="mt-1">envarmor protect</p>
          <p>envarmor audit-ai</p>
        </div>
      </section>

      <section className="border-8 border-black bg-neo-muted p-5 shadow-neo-lg text-sm text-black">
        <h3 className="text-lg font-black text-black">Why this matters</h3>
        <p className="mt-2 font-bold">
          AI context indexing introduced a new secret-leak surface. Developers reported env exposure incidents in 2024 tied to
          workspace context behavior.
        </p>
      </section>

      <Link href={`/projects/${slug}`} className="inline-flex border-4 border-black bg-neo-accent px-4 py-2 text-sm font-black uppercase tracking-widest text-white shadow-neo-sm">
        Back to project
      </Link>
    </main>
  );
}
