import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Calendar, BarChart3, ShieldCheck, ScanLine, Vault } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getUserProjectSummaries } from '@/lib/site-data';
import { CreateProjectButton } from '@/app/components/create-project-button';

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

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  const data = await getUserProjectSummaries(user.email);

  if (!data) {
    redirect('/login');
  }

  const totalProjects = data.projects.length;
  const totalScans = data.projects.reduce((sum, project) => sum + project.scanCount, 0);
  const totalSavedLow = data.projects.reduce((sum, project) => sum + project.totalSavedLow, 0);
  const totalSavedHigh = data.projects.reduce((sum, project) => sum + project.totalSavedHigh, 0);

  return (
    <div className="space-y-8">
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">
              Projects
            </p>
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">
              Live project room.
            </h1>
            <p className="mt-3 max-w-xl text-lg font-bold text-black">
              Dynamic project data.
            </p>
          </div>
          <CreateProjectButton />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Projects', value: totalProjects, icon: BarChart3 },
          { label: 'Scans', value: totalScans, icon: ScanLine },
          { label: 'Saved', value: formatSavingsRange(totalSavedLow, totalSavedHigh), icon: ShieldCheck },
          { label: 'Plan', value: data.plan, icon: Vault }
        ].map((item) => (
          <div key={item.label} className="border-4 border-black bg-neo-muted p-5 shadow-neo-sm">
            <item.icon className="h-6 w-6 stroke-[3px]" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-black">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-black">{item.value}</p>
          </div>
        ))}
      </section>

      {data.projects.length === 0 ? (
        <div className="border-8 border-black bg-white p-8 shadow-neo-lg">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 stroke-[3px] text-black" />
            <h2 className="mt-4 text-2xl font-black text-black">No projects yet</h2>
            <p className="mt-2 font-bold text-black">Create first project to start scanning.</p>
            <div className="mt-6 flex justify-center">
              <CreateProjectButton />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.projects.map((project, index) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className={`border-8 border-black bg-white p-5 shadow-neo-lg transition-transform duration-150 hover:-translate-y-1 ${index % 3 === 1 ? 'rotate-1' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-black">{project.name}</h2>
                  <p className="mt-1 font-bold text-black">{project.description || 'No description yet'}</p>
                </div>
                <ArrowRight className="h-5 w-5 stroke-[3px] text-black" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="border-4 border-black bg-neo-bg p-3">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-black">Scans</p>
                  <p className="mt-2 text-2xl font-black text-black">{project.scanCount}</p>
                </div>
                <div className="border-4 border-black bg-neo-bg p-3">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-black">Saved</p>
                  <p className="mt-2 text-2xl font-black text-black truncate" title={formatSavingsRange(project.totalSavedLow, project.totalSavedHigh)}>
                    {formatSavingsRange(project.totalSavedLow, project.totalSavedHigh)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-black shadow-neo-sm">
                  {project.topSecretType}
                </span>
                <span className="border-4 border-black bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-neo-secondary shadow-neo-sm">
                  Last scan {formatRelative(project.lastScanAt)}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t-4 border-black pt-4 text-xs font-black uppercase tracking-[0.25em] text-black">
                <Calendar className="h-4 w-4 stroke-[3px]" />
                Updated {formatRelative(project.updatedAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
