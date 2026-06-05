import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectDetailBySlug } from '@/lib/site-data';
import DeleteProjectButton from '@/app/components/delete-project-button';

export const revalidate = 0;

function formatRelative(dateIso: string | null): string {
  if (!dateIso) {
    return 'Never';
  }

  const date = new Date(dateIso);
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
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

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  const data = await getProjectDetailBySlug(user.email, slug);

  if (!data) {
    redirect('/projects');
  }

  const canAccessVault = data.plan !== 'FREE';

  return (
    <div className="space-y-8">
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">
              Project
            </p>
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">
              {data.project.name}
            </h1>
            <p className="mt-3 max-w-2xl font-bold text-black">
              {data.project.description || 'No description yet'}
            </p>
          </div>
          <Link
            href={`/projects/${slug}/ai-protection`}
            className="inline-flex w-fit items-center gap-2 border-4 border-black bg-black px-5 py-3 text-sm font-black uppercase tracking-widest text-neo-secondary shadow-neo-sm"
          >
            AI Protection
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Scans', value: data.project.scanCount },
          { label: 'Saved', value: formatSavingsRange(data.project.totalSavedLow, data.project.totalSavedHigh) },
          { label: 'Teams', value: data.project.teamCount },
          { label: 'Top Type', value: data.project.topSecretType }
        ].map((item) => (
          <div key={item.label} className="border-4 border-black bg-neo-muted p-5 shadow-neo-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-black">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-black">{item.value}</p>
          </div>
        ))}
      </section>

      {!canAccessVault && (
        <div className="border-4 border-black bg-neo-accent p-5 text-white shadow-neo-md">
          <p className="text-xs font-black uppercase tracking-[0.3em]">Vault locked</p>
          <p className="mt-2 font-bold">Upgrade to BASIC to unlock secret vault for this project.</p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border-8 border-black bg-white p-5 shadow-neo-lg">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-black">Recent scan events</h2>
              <p className="font-bold text-black">Live history for this project.</p>
            </div>
            <p className="border-4 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.25em] text-neo-secondary">
              Updated {formatRelative(data.project.updatedAt)}
            </p>
          </div>

          {data.scanEvents.length === 0 ? (
            <div className="border-4 border-black bg-neo-bg p-5 font-bold text-black">No scan events yet.</div>
          ) : (
            <div className="space-y-3">
              {data.scanEvents.map((event) => (
                <div key={event.id} className="border-4 border-black bg-neo-bg p-4 shadow-neo-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-black uppercase text-black">{event.type}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.25em] text-black">
                        {event.file}:{event.line} • {event.severity}
                      </p>
                    </div>
                    <span className={`border-4 border-black px-3 py-1 text-xs font-black uppercase tracking-[0.25em] ${event.blocked ? 'bg-neo-secondary text-black' : 'bg-white text-black'}`}>
                      {event.blocked ? 'Blocked' : 'Detected'}
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-sm font-bold text-black">
                    Saved {formatSavingsRange(event.savedUSDLow, event.savedUSDHigh)} • {formatRelative(event.time)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="border-8 border-black bg-black p-5 text-white shadow-neo-lg">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-neo-secondary">Summary</p>
            <div className="mt-4 space-y-2 font-mono text-sm leading-7">
              <p>Project ID: {data.project.id}</p>
              <p>Slug: {data.project.slug}</p>
              <p>Created: {new Date(data.project.createdAt).toLocaleDateString()}</p>
              <p>Last scan: {formatRelative(data.project.lastScanAt)}</p>
            </div>
          </div>

          <div className="border-8 border-black bg-white p-5 shadow-neo-lg">
            <h3 className="text-xl font-black text-black">Actions</h3>
            <div className="mt-4 space-y-3">
              <Link href={`/projects/${slug}/ai-protection`} className="block border-4 border-black bg-neo-accent px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-white shadow-neo-sm">
                Open AI Protection
              </Link>
              <Link href={`/projects/${slug}/scan-history`} className="block border-4 border-black bg-white px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-black shadow-neo-sm">
                View Scan History
              </Link>
              <Link href={`/projects/${slug}/vault`} className="block border-4 border-black bg-neo-secondary px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-black shadow-neo-sm">
                Open Vault
              </Link>
              <DeleteProjectButton projectSlug={slug} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
