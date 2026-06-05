import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLegacyUserByEmail } from '@/lib/legacy-user';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

function groupByEnvironment(secrets: Array<{ id: string; name: string; environment: string; version: number }>) {
  return {
    DEV: secrets.filter((secret) => secret.environment === 'DEV' || secret.environment === 'development' || (secret.environment as string) === 'development'),
    STAGING: secrets.filter((secret) => secret.environment === 'STAGING' || secret.environment === 'staging' || (secret.environment as string) === 'staging'),
    PROD: secrets.filter((secret) => secret.environment === 'PROD' || secret.environment === 'production' || (secret.environment as string) === 'production')
  };
}

export default async function ProjectVaultPage({ params }: { params: Promise<{ slug: string }> }) {
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

  if (user.plan === 'FREE') {
    return (
      <main className="space-y-6">
        <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
          <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">Vault</p>
          <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">Secret vault is locked.</h1>
          <p className="mt-3 max-w-2xl font-bold text-black">Upgrade to BASIC to access encrypted secret storage for {project.name}.</p>
        </section>
      </main>
    );
  }

  const secrets = await prisma.secret.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: 'desc' }
  });

  const grouped = groupByEnvironment(secrets);

  return (
    <main className="space-y-8">
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">Vault</p>
        <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">{project.name} Vault.</h1>
        <p className="mt-3 max-w-2xl font-bold text-black">Encrypted secrets for this project.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Development', value: grouped.DEV.length },
          { label: 'Staging', value: grouped.STAGING.length },
          { label: 'Production', value: grouped.PROD.length }
        ].map((item) => (
          <div key={item.label} className="border-4 border-black bg-neo-muted p-5 shadow-neo-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-black">{item.label}</p>
            <p className="mt-3 text-3xl font-black text-black">{item.value}</p>
          </div>
        ))}
      </section>

      {(['DEV', 'STAGING', 'PROD'] as const).map((env) => (
        <section key={env} className="border-8 border-black bg-white p-5 shadow-neo-lg">
          <div className="mb-4 flex items-center justify-between gap-4 border-b-4 border-black pb-4">
            <div>
              <h2 className="text-2xl font-black text-black">{env}</h2>
              <p className="font-bold text-black">{grouped[env].length} secret(s) in this environment</p>
            </div>
          </div>

          {grouped[env].length === 0 ? (
            <div className="border-4 border-black bg-neo-bg p-5 font-bold text-black">No secrets stored here yet.</div>
          ) : (
            <div className="grid gap-3">
              {grouped[env].map((secret) => (
                <div key={secret.id} className="border-4 border-black bg-neo-bg p-4 shadow-neo-sm">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-mono text-xs font-black uppercase text-black">{secret.name}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.25em] text-black">v{secret.version}</p>
                    </div>
                    <span className="border-4 border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-black">Encrypted</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
