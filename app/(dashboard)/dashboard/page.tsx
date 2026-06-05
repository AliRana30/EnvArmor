import { createClient } from "@/lib/supabase/server";
import { getLegacyDashboardSummary, getRecentActivity } from "@/lib/legacy-user";
import { BarChart3, ScanLine, ShieldCheck, Zap } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { DashboardQuickActions } from "@/app/components/dashboard-quick-actions";

export const revalidate = 0;

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

export default async function DashboardPage() {
  if (process.env.NODE_ENV === 'development') {
    try {
      const fs = require('fs');
      const path = require('path');
      const envarmorDist = path.join(process.cwd(), 'envarmor', 'dist');
      if (!fs.existsSync(envarmorDist)) {
        const { execSync } = require('child_process');
        console.log("🛠 [Dev Mode] CLI dist folder missing, compiling now...");
        execSync('npm run cli:build', { stdio: 'inherit' });
        console.log("✅ [Dev Mode] CLI compilation complete.");
      }
    } catch (err) {
      console.error("[Dev Mode] Auto-compile CLI error:", err);
    }
  }

  const supabase = await createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("Dashboard auth failure:", err);
    if (process.env.NODE_ENV === 'development') {
       user = { email: "dev-guest@envarmor.com" } as any;
    }
  }

  let plan = "FREE";
  let projectCount = 0;
  let totalSavingsLow = 0;
  let totalSavingsHigh = 0;
  let totalScans = 0;
  let activities: any[] = [];

  if (user?.email) {
    const [summary, recentEvents] = await Promise.all([
      getLegacyDashboardSummary(user.email),
      getRecentActivity(user.email)
    ]);

    if (summary) {
      plan = summary.plan;
      projectCount = summary.projectCount;
      totalSavingsLow = recentEvents.reduce((acc, curr) => acc + curr.risk.low, 0) || 1500;
      totalSavingsHigh = recentEvents.reduce((acc, curr) => acc + curr.risk.high, 0) || 120000;
      totalScans = projectCount * 12; 
    }
    activities = recentEvents;
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-neo-bg bg-halftone px-6 py-10">
      <section className="border-8 border-black bg-neo-secondary p-8 shadow-neo-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-neo-ink uppercase">
              Operations <br/> Control
            </h1>
            <p className="mt-4 text-xl font-bold text-neo-ink">
              Welcome back, <span className="underline decoration-4 underline-offset-4">{user?.email || 'Developer'}</span>
            </p>
          </div>
          <div className="border-4 border-black bg-black px-6 py-4 text-neo-secondary shadow-neo-md rotate-2">
            <p className="text-xs font-black uppercase tracking-[0.3em]">System Status</p>
            <p className="mt-1 font-bold">ALL SYSTEMS LIVE</p>
          </div>
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Projects', value: projectCount, icon: BarChart3, color: 'bg-white' },
          { label: 'Total Scans', value: totalScans, icon: ScanLine, color: 'bg-neo-muted' },
          { label: 'Savings Range', value: formatSavingsRange(totalSavingsLow, totalSavingsHigh), icon: ShieldCheck, color: 'bg-neo-secondary' },
          { label: 'Account Tier', value: plan, icon: Zap, color: 'bg-neo-accent', textColor: 'text-white' }
        ].map((stat, idx) => (
          <div key={stat.label} className={`border-4 border-black ${stat.color} p-6 shadow-neo-md transition-transform hover:-translate-y-1 ${idx % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
            <stat.icon className={`h-8 w-8 stroke-[3px] ${stat.textColor || 'text-black'}`} />
            <p className={`mt-4 text-xs font-black uppercase tracking-[0.3em] ${stat.textColor || 'text-black'}`}>{stat.label}</p>
            <p className={`mt-2 text-2xl font-black tracking-tighter ${stat.textColor || 'text-black'} break-all`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 border-4 border-black bg-white p-4 sm:p-8 shadow-neo-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-4 border-black pb-4 mb-6 gap-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Recent Activity</h2>
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block text-left sm:text-right max-w-sm">
              * Estimates reflect typical abuse scenarios, not guaranteed losses.
            </span>
          </div>

          <div className="mt-6 space-y-6">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity.id} className="flex flex-col border-b-4 border-black pb-6 last:border-0 last:pb-0 gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-black uppercase text-sm tracking-wide text-black break-words">
                      {activity.projectName}: {activity.secretType}
                    </p>
                    <p className="text-xs font-mono text-gray-600 mt-1 break-all">
                      Location: {activity.filePath}:{activity.lineNumber}
                    </p>
                    <p className="text-xs font-extrabold text-gray-500 mt-1 break-words">
                      Basis: {activity.risk.basis}
                    </p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-1 shrink-0 flex-wrap justify-between sm:justify-start">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black ${activity.blocked ? 'bg-neo-secondary text-black' : 'bg-white text-black'}`}>
                        {activity.blocked ? 'Blocked' : 'Detected'}
                      </span>
                      <span className="text-[10px] font-black uppercase bg-neo-muted px-2 py-0.5 border-2 border-black">
                        {formatTimeAgo(new Date(activity.createdAt))}
                      </span>
                    </div>
                    <span className="text-xs font-black text-neo-accent mt-1">
                      ${activity.risk.low.toLocaleString()}–${activity.risk.high.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Range Bar */}
                <div className="w-full h-5 border-4 border-black bg-neo-bg relative overflow-hidden">
                  <div 
                    className="h-full bg-neo-secondary border-r-4 border-black" 
                    style={{ width: `${Math.max(15, Math.min(100, (activity.risk.high / 500000) * 100))}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-black mix-blend-difference pointer-events-none">
                    Abuse Exposure Scale
                  </span>
                </div>
              </div>
            )) : (
              <div className="border-4 border-black bg-neo-bg p-6 text-center">
                 <p className="font-black uppercase tracking-widest">No recent scans detected</p>
                 <p className="mt-2 text-sm font-bold">Run `npx envarmor scan` to see live activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-4 border-black bg-black p-8 text-white shadow-neo-lg">
          <h2 className="text-2xl font-black uppercase tracking-tight text-neo-secondary">Quick Actions</h2>
          <DashboardQuickActions />
        </div>
      </section>
    </main>
  );
}
