import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLegacyUserByEmail } from '@/lib/legacy-user';
import { prisma } from '@/lib/prisma';
import { ApiKeyBox } from '@/app/components/api-key-box';
import { SettingsForm } from '@/app/components/settings-form';

export const revalidate = 0; // force dynamic load to pick up changes instantly

export default async function SettingsPage() {
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

  const fullUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: {
      apiKey: true,
      createdAt: true,
      updatedAt: true,
      email: true,
      name: true,
      plan: true,
      emailOnDetection: true,
      emailWeeklyDigest: true,
      emailRotationReminder: true,
      slackWebhookUrl: true
    }
  });

  if (!fullUser) {
    redirect('/login');
  }

  const projectCount = await prisma.project.count({ where: { userId: user.id } });
  const teamCount = await prisma.teamMember.count({ where: { userId: user.id } });
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });

  return (
    <main className="space-y-8">
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">Settings</p>
        <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">Account settings.</h1>
        <p className="mt-3 max-w-2xl font-bold text-black">All values below come from the live user record and subscription tables.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Plan', value: fullUser.plan },
          { label: 'Projects', value: projectCount },
          { label: 'Team members', value: teamCount }
        ].map((item) => (
          <div key={item.label} className="border-4 border-black bg-neo-muted p-5 shadow-neo-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-black">{item.label}</p>
            <p className="mt-3 text-3xl font-black text-black">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border-8 border-black bg-white p-5 shadow-neo-lg">
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Account</h2>
          <div className="mt-4 space-y-3 font-bold text-black">
            <p>Email: {fullUser.email}</p>
            <p>Name: {fullUser.name ?? 'Not set'}</p>
            <p>Member since: {new Date(fullUser.createdAt).toLocaleDateString()}</p>
            <p>Last account update: {new Date(fullUser.updatedAt).toLocaleDateString()}</p>
            <p>Subscription: {subscription ? `${subscription.plan} / ${subscription.status}` : 'No active subscription'}</p>
          </div>
        </div>

        <ApiKeyBox apiKey={fullUser.apiKey} />
      </section>

      <SettingsForm initialUser={fullUser} />
    </main>
  );
}