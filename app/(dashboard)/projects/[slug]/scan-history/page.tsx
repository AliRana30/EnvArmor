import { redirect } from 'next/navigation';
import { ScanLine } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getLegacyUserByEmail } from '@/lib/legacy-user';
import { prisma } from '@/lib/prisma';

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

export default async function ProjectScanHistoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect('/login');
  }

  const user = await getLegacyUserByEmail(authUser.email);
  if (!user) {
    redirect('/login');
  }

  const project = await prisma.project.findFirst({
    where: { userId: user.id, slug }
  });

  if (!project) {
    redirect('/projects');
  }

  const events = await prisma.scanEvent.findMany({
    where: { userId: user.id, projectId: project.id },
    include: {
      project: { select: { name: true, slug: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const blockedCount = events.filter((event) => event.blocked).length;
  const totalSaved = events.reduce((sum, event) => sum + event.estimatedCostSaved, 0);

  return (
    <main className="space-y-8">
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <p className="mb-3 inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">
          Scan History
        </p>
        <div>
          <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">{project.name} timeline.</h1>
          <p className="mt-3 max-w-2xl font-bold text-black">
            Every detected secret comes from the real database, specifically filtered for this project.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Events', value: events.length },
          { label: 'Blocked', value: blockedCount },
          { label: 'Saved', value: `$${totalSaved.toLocaleString()}` }
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
          <h2 className="text-2xl font-black text-black">Project scan events</h2>
        </div>

        {events.length === 0 ? (
          <div className="border-4 border-black bg-neo-bg p-5 font-bold text-black">No scan events yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-4 border-black">
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Type</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Severity</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Location</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Status</th>
                  <th className="py-3 px-4 text-right font-black uppercase tracking-[0.2em] text-black">Saved</th>
                  <th className="py-3 px-4 text-left font-black uppercase tracking-[0.2em] text-black">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b-2 border-black/20 hover:bg-neo-bg">
                    <td className="py-3 px-4 font-mono text-xs font-black text-black">{event.secretType}</td>
                    <td className="py-3 px-4 font-black text-black">{event.severity}</td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-black break-all">{event.filePath}:{event.lineNumber}</td>
                    <td className="py-3 px-4 font-black text-black">{event.blocked ? 'Blocked' : 'Detected'}</td>
                    <td className="py-3 px-4 text-right font-black text-black">${event.estimatedCostSaved.toLocaleString()}</td>
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
