import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download, ScanLine } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getLegacyUserByEmail } from '@/lib/legacy-user';
import { prisma } from '@/lib/prisma';
import { estimateSavings } from '@/lib/savings-engine';

export const revalidate = 0;

function formatRelative(date: Date): string {
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function formatSavingsRange(low: number, high: number): string {
  if (low === 0 && high === 0) return "$0";
  
  const fmt = (val: number) => {
    if (val >= 1000) {
      const k = val / 1000;
      return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
    }
    return `$${val}`;
  };

  return `${fmt(low)}–${fmt(high)}`;
}

export default async function ScanHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect('/login');
  }

  const user = await getLegacyUserByEmail(authUser.email);
  if (!user) {
    redirect('/login');
  }

  let events: any[] = [];
  try {
    events = await prisma.scanEvent.findMany({
      where: { userId: user.id },
      include: {
        project: { select: { name: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  } catch (err: any) {
    console.error("⚠️ Database connection failed in ScanHistoryPage:", err.message);
    if (process.env.NODE_ENV === 'development') {
      events = [
        {
          id: "mock-scan-1",
          secretType: "STRIPE_SECRET",
          severity: "CRITICAL",
          project: { name: "My First Project", slug: "my-first-project" },
          filePath: "src/index.ts",
          lineNumber: 22,
          blocked: true,
          estimatedCostSaved: 500,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          id: "mock-scan-2",
          secretType: "AWS_SECRET_KEY",
          severity: "CRITICAL",
          project: { name: "My First Project", slug: "my-first-project" },
          filePath: ".env",
          lineNumber: 3,
          blocked: true,
          estimatedCostSaved: 1000,
          createdAt: new Date(Date.now() - 86400000)
        }
      ];
    }
  }

  const blockedCount = events.filter((event) => event.blocked).length;

  let totalSavedLow = 0;
  let totalSavedHigh = 0;
  
  const mappedEvents = events.map((event) => {
    const savings = estimateSavings(event.secretType, event.severity, event.blocked);
    totalSavedLow += savings.low;
    totalSavedHigh += savings.high;
    return {
      ...event,
      savingsLow: savings.low,
      savingsHigh: savings.high
    };
  });

  return (
    <main className="space-y-8">
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <p className="mb-3 inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">
          Scan History
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">Live secret timeline.</h1>
            <p className="mt-3 max-w-2xl font-bold text-black">
              Every detected secret comes from the real database, grouped by project and sorted by newest first.
            </p>
          </div>
          <Link href="/projects" className="inline-flex w-fit items-center gap-2 border-4 border-black bg-black px-5 py-3 text-sm font-black uppercase tracking-widest text-neo-secondary shadow-neo-sm">
            Go to Projects
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Events', value: mappedEvents.length },
          { label: 'Blocked', value: blockedCount },
          { label: 'Saved', value: formatSavingsRange(totalSavedLow, totalSavedHigh) }
        ].map((item) => (
          <div key={item.label} className="border-4 border-black bg-neo-muted p-5 shadow-neo-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-black">{item.label}</p>
            <p className="mt-3 text-3xl font-black text-black">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="border-8 border-black bg-white p-5 shadow-neo-lg">
        <div className="mb-4 flex items-center gap-2 border-b-4 border-black pb-4">
          <ScanLine className="h-5 w-5 stroke-[3px]" />
          <h2 className="text-2xl font-black text-black">All scan events</h2>
        </div>

        {mappedEvents.length === 0 ? (
          <div className="border-4 border-black bg-neo-bg p-5 font-bold text-black">No scan events yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-4 border-black">
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Type</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Severity</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Project</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Location</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Status</th>
                  <th className="py-3 px-4 text-right font-black uppercase tracking-[0.2em] text-black">Saved</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Time</th>
                </tr>
              </thead>
              <tbody>
                {mappedEvents.map((event) => (
                  <tr key={event.id} className="border-b-2 border-black/20 hover:bg-neo-bg">
                    <td className="py-3 px-4 font-mono text-xs font-black text-black">{event.secretType}</td>
                    <td className="py-3 px-4 font-black text-black">{event.severity}</td>
                    <td className="py-3 px-4 font-bold text-black">
                      <Link href={`/projects/${event.project.slug}`} className="underline underline-offset-4">{event.project.name}</Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-black break-all">{event.filePath}:{event.lineNumber}</td>
                    <td className="py-3 px-4 font-black text-black">{event.blocked ? 'Blocked' : 'Detected'}</td>
                    <td className="py-3 px-4 text-right font-black text-black">{formatSavingsRange(event.savingsLow, event.savingsHigh)}</td>
                    <td className="py-3 px-4 font-bold text-black">{formatRelative(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}