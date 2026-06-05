import { getPublicSiteStats } from '@/lib/site-data';

export const revalidate = 300;

export default async function StatsPage() {
  const stats = await getPublicSiteStats();
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <main className="min-h-screen bg-neo-bg bg-dots text-neo-ink">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-3xl border-8 border-black bg-white p-6 shadow-neo-lg">
          <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-black shadow-neo-sm">
            Public stats
          </p>
          <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">
            EnvArmor is blocking secrets across real developer teams.
          </h1>
          <p className="mt-4 max-w-2xl font-bold text-black">
            Live public proof updated from the same production counters used in the dashboard.
          </p>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <StatCard label="Secrets blocked" value={String(stats.secretsBlocked)} />
          <StatCard label="Developers protected" value={String(stats.developers)} />
          <StatCard label="Projects tracked" value={String(stats.projects)} />
          <StatCard label="Estimated savings" value={formatter.format(stats.totalSavings)} />
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="border-8 border-black bg-white p-6 shadow-neo-lg">
            <h2 className="text-2xl font-black text-black">Most common secret types</h2>
            <div className="mt-6 space-y-4">
              {stats.commonSecretTypes.map((entry) => (
                <div key={entry.secretType} className="flex items-center justify-between border-b-4 border-black pb-3">
                  <span className="text-sm font-bold text-black">{entry.secretType}</span>
                  <span className="text-sm font-black text-black">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-8 border-black bg-black p-6 shadow-neo-lg text-white">
            <h2 className="text-2xl font-black text-neo-secondary">Why the savings feel credible</h2>
            <p className="mt-4 font-bold leading-7 text-white">
              Savings use severity and block multipliers grounded in breach-cost methodology, so blocked keys contribute more than passive detections.
            </p>
            <div className="mt-6 border-4 border-black bg-neo-secondary px-4 py-3 text-sm font-black uppercase tracking-[0.3em] text-black">
              Blocked count: {stats.secretsBlocked}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-8 border-black bg-neo-muted p-5 shadow-neo-sm">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-black">{label}</p>
      <p className="mt-3 text-3xl font-black text-black">{value}</p>
    </div>
  );
}
