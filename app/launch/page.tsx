import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicSiteStats } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'EnvArmor Product Hunt Launch',
  description:
    'Scan your codebase for leaked secrets in 60 seconds - free forever. Product Hunt launch details, screenshots, and founder notes.'
};

const firstComment = `Hi! I built EnvArmor after accidentally committing my Env's to a public repo.
That mistake could have cost thousands.
EnvArmor scans for 40+ secret types, blocks pre-commit, syncs secrets across your team, and shows you exactly how much a breach would have cost you.
Free npm package - works offline - no credit card ever for the free tier.
Would love your feedback on what secret types you hit most often!`;

export const revalidate = 300;

export default async function LaunchPage() {
  const stats = await getPublicSiteStats();

  return (
    <main className="min-h-screen bg-neo-bg bg-dots px-6 py-14 text-neo-ink">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-8 border-black bg-white p-6 shadow-neo-lg">
          <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-black shadow-neo-sm">Product Hunt Launch</p>
          <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">EnvArmor</h1>
          <p className="mt-4 max-w-3xl text-lg font-bold text-black">Scan your codebase for leaked secrets in 60 seconds - free forever.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Secrets blocked', value: stats.secretsBlocked.toLocaleString() },
            { label: 'Developers protected', value: stats.developers.toLocaleString() },
            { label: 'Projects tracked', value: stats.projects.toLocaleString() },
            { label: 'Savings created', value: `$${stats.totalSavings.toLocaleString()}` }
          ].map((item) => (
            <div key={item.label} className="border-8 border-black bg-neo-muted p-5 shadow-neo-sm">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-black">{item.label}</p>
              <p className="mt-3 text-3xl font-black text-black">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
          <h2 className="text-2xl font-black text-black">Launch assets</h2>
          <ul className="mt-4 space-y-3 text-sm font-bold text-black">
            <li>Tagline: Scan your codebase for leaked secrets in 60 seconds - free forever</li>
            <li>Positioning: Better than gitignore because it covers AI context, git history, and inline secrets</li>
            <li>Founder story: Real incident led to building EnvArmor</li>
          </ul>
        </section>

        <section className="border-8 border-black bg-black p-6 shadow-neo-lg text-white">
          <h2 className="text-2xl font-black text-neo-secondary">First comment template</h2>
          <pre className="mt-3 overflow-x-auto border-4 border-black bg-white p-4 text-xs font-bold text-black">{firstComment}</pre>
        </section>

        <section className="border-8 border-black bg-neo-secondary p-6 shadow-neo-lg">
          <h2 className="text-2xl font-black text-black">Product Hunt widget</h2>
          <p className="mt-2 font-bold text-black">Add the official Product Hunt embed after launch with your product slug.</p>
          <Link href="/" className="mt-4 inline-flex border-4 border-black bg-black px-4 py-2 text-sm font-black uppercase tracking-widest text-neo-secondary shadow-neo-sm">
            Back to homepage
          </Link>
        </section>
      </div>
    </main>
  );
}
