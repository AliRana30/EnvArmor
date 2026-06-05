import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getLegacyUserByEmail } from '@/lib/legacy-user';
import { prisma } from '@/lib/prisma';

export const revalidate = 300;

function groupByEnvironment(secrets: Array<{ id: string; name: string; environment: string; version: number; project: { name: string; slug: string } }>) {
  return {
    DEV: secrets.filter((secret) => secret.environment === 'DEV'),
    STAGING: secrets.filter((secret) => secret.environment === 'STAGING'),
    PROD: secrets.filter((secret) => secret.environment === 'PROD')
  };
}

export default async function VaultPage() {
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

  if (user.plan === 'FREE') {
    return (
      <main className="space-y-6">
        <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
          <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">Vault</p>
          <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">Secret vault is locked.</h1>
          <p className="mt-3 max-w-2xl font-bold text-black">Upgrade to BASIC to access encrypted secret storage and sync with envarmor pull and envarmor push.</p>
          <span className="mt-5 inline-flex border-4 border-black bg-neo-accent px-4 py-2 text-sm font-black uppercase tracking-widest text-white shadow-neo-sm opacity-50 cursor-not-allowed">Upgrade Coming Soon</span>
        </section>
      </main>
    );
  }

  const secrets = await prisma.secret.findMany({
    where: { project: { userId: user.id } },
    include: {
      project: { select: { name: true, slug: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const grouped = groupByEnvironment(secrets);

  return (
    <main className="space-y-8">
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">Vault</p>
        <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">Encrypted secret storage.</h1>
        <p className="mt-3 max-w-2xl font-bold text-black">Every secret below is live data from the vault table.</p>
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
            <Link href="/scan-history" className="inline-flex items-center gap-2 border-4 border-black bg-black px-4 py-2 text-sm font-black uppercase tracking-widest text-neo-secondary shadow-neo-sm">
              <Download className="h-4 w-4 stroke-[3px]" />
              Export
            </Link>
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
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.25em] text-black">{secret.project.name} • v{secret.version}</p>
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