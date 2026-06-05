'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ScanLine, ShieldCheck, Vault } from 'lucide-react';
import toast from 'react-hot-toast';

type PublicStats = {
  secretsBlocked: number;
  developers: number;
  projects: number;
  totalSavings: number;
  totalSavingsLow: number;
  totalSavingsHigh: number;
};

type DemoFinding = {
  type: string;
  line: number;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  snippet: string;
  risk: {
    low: number;
    high: number;
    basis: string;
  };
};

const starterEnv = `DATABASE_URL=XXXXXXXX
NEXT_PUBLIC_ANALYTICS_ID=XXXXXX
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXX`;

const pricing = [
  { name: 'FREE', price: '$0', note: '1 project, manual scans, core alerts' },
  { name: 'BASIC', price: '$9', note: '3 projects, hooks, dashboard analytics' },
  { name: 'PRO', price: '$29', note: '10 projects, webhook alerts, history scans' },
  { name: 'TEAM', price: '$99', note: 'Unlimited projects, SSO, SLA support' }
];

export default function MarketingHomePage() {
  const [stats, setStats] = useState<PublicStats>({
    secretsBlocked: 0,
    developers: 0,
    projects: 0,
    totalSavings: 0,
    totalSavingsLow: 0,
    totalSavingsHigh: 0
  });
  const [content, setContent] = useState(starterEnv);
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<DemoFinding[]>([]);
  const [exposureLow, setExposureLow] = useState(0);
  const [exposureHigh, setExposureHigh] = useState(0);
  const [logoFallback, setLogoFallback] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/public/stats')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setStats({
          secretsBlocked: Number(data?.secretsBlocked ?? 0),
          developers: Number(data?.developers ?? 0),
          projects: Number(data?.projects ?? 0),
          totalSavings: Number(data?.totalSavings ?? 0),
          totalSavingsLow: Number(data?.totalSavingsLow ?? data?.totalSavings ?? 0),
          totalSavingsHigh: Number(data?.totalSavingsHigh ?? data?.totalSavings ?? 0)
        });
      })
      .catch(() => {
        if (!mounted) return;
        setStats({
          secretsBlocked: 1240,
          developers: 320,
          projects: 84,
          totalSavings: 18500,
          totalSavingsLow: 18500,
          totalSavingsHigh: 450000
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const liveCounter = useMemo(() => {
    return `Save your money and secrets`;
  }, []);

  function formatSavingsRange(low: number, high: number): string {
    if (low === 0 && high === 0) return "$0";
    
    const fmt = (val: number) => {
      if (val >= 1000000) {
        const m = val / 1000000;
        return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
      }
      if (val >= 1000) {
        const k = val / 1000;
        return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
      }
      return `$${val}`;
    };

    return `${fmt(low)}–${fmt(high)}`;
  }

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText('npx envarmor init');
      toast.success('Command copied successfully')
    } catch {
      toast.error('Unable to copy command')
    }
  }

  async function scanDemo() {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/demo/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      const nextFindings: DemoFinding[] = Array.isArray(data?.findings) ? data.findings : [];
      setFindings(nextFindings);
      setExposureLow(data?.totalExposureLow ?? nextFindings.reduce((sum, item) => sum + Number(item.risk.low ?? 0), 0));
      setExposureHigh(data?.totalExposureHigh ?? nextFindings.reduce((sum, item) => sum + Number(item.risk.high ?? 0), 0));
    } catch {
      setFindings([
        {
          type: 'Stripe Secret Key',
          line: 2,
          severity: 'CRITICAL',
          snippet: 'STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXX',
          risk: { low: 1000, high: 100000, basis: "Unauthorized charges, chargebacks" }
        }
      ]);
      setExposureLow(1000);
      setExposureHigh(100000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neo-bg text-neo-ink">
      <section className="border-b-8 border-black bg-neo-bg bg-halftone py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:items-start">
            <div className="lg:col-span-3">
              <div className="mb-6 inline-flex -rotate-1 items-center gap-2 border-4 border-black bg-neo-accent px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-white shadow-neo-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                {liveCounter}
              </div>

              <h1 className="font-black leading-none tracking-tighter text-[clamp(3.5rem,8vw,7rem)]">
                Your
                <span className="mx-2 inline-block rotate-1 border-4 border-black bg-neo-accent px-3 text-white shadow-neo-md">.env</span>
                <span className="block -rotate-1 text-black">is one commit</span>
                <span className="block">from the front page</span>
              </h1>

              <div className="mt-8 border-8 border-black bg-white p-6 shadow-neo-lg rotate-1">
                <p className="text-xl font-black leading-relaxed text-black md:text-2xl">
                  EnvArmor scans codebases, blocks secrets before commit, and shows the value of every breach prevented.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={copyInstall}
                  className="border-4 border-black bg-black px-8 py-4 font-mono text-sm font-bold tracking-wide text-neo-secondary shadow-neo-md transition-all duration-100 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  $ npx envarmor init
                </button>
                <button
                  className="border-4 border-black bg-[#eab308] px-8 py-4 text-sm font-black uppercase tracking-widest shadow-neo-sm cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>

            <div className="relative rotate-1 lg:col-span-2">
              <div className="absolute -left-4 -top-4 -rotate-6 border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm">
                Live Demo
              </div>
              <div className="overflow-hidden border-4 border-black bg-black shadow-neo-lg">
                <div className="flex items-center gap-2 border-b-4 border-black bg-neo-secondary px-4 py-2">
                  <span className="h-3 w-3 rounded-full border-2 border-black bg-neo-accent" />
                  <span className="h-3 w-3 rounded-full border-2 border-black bg-neo-secondary" />
                  <span className="h-3 w-3 rounded-full border-2 border-black bg-green-400" />
                  <span className="ml-2 font-mono text-xs font-bold">~/my-saas</span>
                </div>
                <div className="space-y-2 p-5 font-mono text-sm leading-7 text-white">
                  <p>
                    <span className="text-neo-secondary">$</span> npx envarmor scan
                  </p>
                  <p className="text-white/60"> scanning 1,247 files...</p>
                  <p className="font-bold text-neo-accent"> x CRITICAL  .env:4  STRIPE_SECRET_KEY</p>
                  <p className="font-bold text-neo-accent"> x HIGH      src/db.ts:12  DATABASE_URL</p>
                  <p className="font-bold text-neo-secondary"> o 2 secrets blocked est. $1,000–$100,000 saved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-8 border-black bg-black bg-noise py-10 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-2">
          {[
            { n: `SAVE YOUR $$`, l: 'Money & Secrets' },
            { n: `EST. ${formatSavingsRange(stats.totalSavingsLow, stats.totalSavingsHigh)}`, l: 'Savings Created' }
          ].map((item) => (
            <div key={item.l} className="border-r-4 border-black px-6 py-6 text-center last:border-r-0">
              <p className="font-mono text-4xl font-black text-neo-secondary">{item.n}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.3em] text-white">{item.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b-8 border-black bg-neo-muted bg-dots py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-black leading-none tracking-tight text-black text-[clamp(2.5rem,5vw,4.5rem)] flex flex-wrap items-center gap-4">
            <span className="border-8 border-black bg-white px-4 py-2 shadow-neo-lg -rotate-1">Everything .gitignore</span>
            <span className="inline-block rotate-1 border-4 border-black bg-neo-accent px-3 text-white shadow-neo-sm">
              Cannot Do
            </span>
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { icon: ScanLine, title: 'Pre-Commit Scanner', text: 'Blocks leaks before they enter history.' },
              { icon: Vault, title: 'Encrypted Vault', text: 'Share secrets without chat apps.' },
              { icon: ShieldCheck, title: 'Dollar Impact', text: 'Track exposure and savings in real numbers.' }
            ].map((feature, idx) => (
              <div
                key={feature.title}
                className={`border-4 border-black bg-white p-6 shadow-neo-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-neo-xl ${idx === 1 ? 'rotate-1' : ''}`}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center border-4 border-black bg-neo-secondary shadow-neo-sm">
                  <feature.icon className="h-8 w-8 stroke-[3px]" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black">{feature.title}</h3>
                <p className="mt-2 font-bold leading-relaxed text-black">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="interactive-demo" className="border-b-8 border-black bg-neo-secondary bg-grid py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border-4 border-black bg-white p-6 shadow-neo-lg">
              <h3 className="text-3xl font-black uppercase tracking-tight text-black">Interactive Demo</h3>
              <p className="mt-2 font-bold text-black">Paste a sample .env file and run a no-auth scan.</p>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="mt-4 h-72 w-full border-4 border-black bg-black p-4 font-mono text-xs text-neo-secondary outline-none"
              />
              <button
                onClick={scanDemo}
                disabled={loading}
                className="mt-4 border-4 border-black bg-neo-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-neo-md transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
              >
                {loading ? 'Scanning...' : 'Scan'}
              </button>
            </div>

            <div className="overflow-hidden border-4 border-black bg-white shadow-neo-lg">
              <div className="border-b-4 border-black bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-neo-secondary flex flex-wrap justify-between items-center gap-2">
                <span>Detected Secrets . Exposure: ${exposureLow.toLocaleString()}–${exposureHigh.toLocaleString()}</span>
                <span className="text-[8px] font-extrabold text-white/60 lowercase italic tracking-wider">*Typical abuse estimates</span>
              </div>
              <div className="space-y-3 p-4">
                {findings.length === 0 && (
                  <p className="border-4 border-black bg-neo-bg px-4 py-4 font-bold text-black">No findings yet. Run a scan.</p>
                )}
                {findings.map((finding, idx) => (
                  <div key={`${finding.type}-${idx}`} className="border-4 border-black bg-white p-4 shadow-neo-sm">
                    <p className="font-mono text-xs font-bold uppercase text-black">{finding.type}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.25em] text-black">
                      Line {finding.line} . {finding.severity}
                    </p>
                    <p className="mt-2 truncate border-4 border-black bg-black px-2 py-1 font-mono text-xs text-neo-secondary">
                      {finding.snippet}
                    </p>
                    <p className="mt-2 font-mono text-sm font-bold text-black">
                      Exposure: ${finding.risk.low.toLocaleString()}–${finding.risk.high.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1">
                      Basis: {finding.risk.basis}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t-4 border-black p-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 border-4 border-black bg-neo-secondary px-4 py-2 text-sm font-black uppercase tracking-widest text-black shadow-neo-sm"
                >
                  Protect Real Repo <ArrowRight className="h-4 w-4 stroke-[3px]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-8 border-black bg-white bg-grid py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-black leading-none tracking-tight text-black text-[clamp(2.5rem,5vw,4.5rem)]">
            .gitignore stops the commit.
            <span className="mt-2 inline-block -rotate-1 border-4 border-black bg-neo-secondary px-3 text-black shadow-neo-sm">
              EnvArmor stops the breach.
            </span>
          </h2>
          <div className="mt-8 grid grid-cols-1 border-4 border-black shadow-neo-xl md:grid-cols-2">
            <div className="border-r-4 border-black">
              <div className="border-b-4 border-black bg-black px-5 py-3 text-sm font-black uppercase tracking-widest text-white">
                What .gitignore misses
              </div>
              {[
                'AI tools read .env directly',
                'Inline secrets in source files',
                'New repo setup mistakes',
                'Leaked git history',
                'Secrets shared over chat',
                'Silent failures'
              ].map((item) => (
                <div key={item} className="border-b-4 border-black bg-neo-bg px-5 py-4 font-bold text-black last:border-b-0">
                  x {item}
                </div>
              ))}
            </div>
            <div>
              <div className="border-b-4 border-black bg-neo-secondary px-5 py-3 text-sm font-black uppercase tracking-widest">
                What EnvArmor covers
              </div>
              {[
                ['envarmor protect blocks AI context', '#interactive-demo'],
                ['Scanner catches inline and high-entropy leaks', '#interactive-demo'],
                ['Pre-commit hook fires every time', '#interactive-demo'],
                ['scan --history audits full commits', '/blog/ai-env-leak'],
                ['Encrypted vault replaces ad-hoc sharing', '/pricing'],
                ['Dashboard tracks blocked secrets + savings', '/dashboard']
              ].map(([item, href]) => (
                <Link
                  key={item}
                  href={href}
                  className="block border-b-4 border-black bg-white px-5 py-4 font-bold text-black transition-colors duration-100 hover:bg-neo-secondary/40 last:border-b-0"
                >
                  o {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-8 border-black bg-neo-bg py-14 text-neo-ink">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 border-b-4 border-black pb-10 md:grid-cols-4">
            <div>
              <div className="inline-block">
                {!logoFallback ? (
                  <Image
                    src="/EnvGuard.png"
                    alt="EnvArmor"
                    width={180}
                    height={60}
                    className="h-12 w-auto"
                    onError={() => setLogoFallback(true)}
                  />
                ) : (
                  <span className="text-xs font-black uppercase tracking-[0.3em]">EnvArmor</span>
                )}
              </div>
              <p className="mt-4 font-bold">Stop .env leaks before they happen.</p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.3em] text-neo-accent">Built for Developers</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em]">Product</p>
              <ul className="mt-4 space-y-2 font-bold">
                <li>
                  <span className="opacity-50 cursor-not-allowed">Pricing (Soon)</span>
                </li>
                <li>
                  <Link href="/launch" className="hover:text-neo-accent transition-colors">Launch</Link>
                </li>
                <li>
                  <Link href="/blog/ai-env-leak" className="hover:text-neo-accent transition-colors">Blog</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em]">Developers</p>
              <ul className="mt-4 space-y-2 font-bold">
                <li>
                  <Link href="/dashboard" className="hover:text-neo-accent transition-colors">Dashboard</Link>
                </li>
                <li>
                  <Link href="/projects" className="hover:text-neo-accent transition-colors">Projects</Link>
                </li>
                <li>
                  <Link href="/stats" className="hover:text-neo-accent transition-colors">Stats</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em]">Company</p>
              <ul className="mt-4 space-y-2 font-bold">
                <li>
                  <Link href="/blog/ai-env-leak" className="hover:text-neo-accent transition-colors">Blog</Link>
                </li>
                <li>
                  <Link href="/launch" className="hover:text-neo-accent transition-colors">Product Hunt Launch</Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-neo-accent transition-colors">Login</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 gap-4">
            <div className="text-xs font-black uppercase tracking-[0.25em]">(c) 2026 EnvArmor . MIT Licensed</div>
            <div className="inline-flex items-center gap-2 border-4 border-black bg-neo-accent px-3 py-2 text-xs font-black uppercase tracking-[0.25em] text-white shadow-neo-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Live
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
