import Link from 'next/link';


export default function DocsPage() {
  return (
    <main className="space-y-8">
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <p className="inline-flex border-4 border-black bg-neo-secondary px-3 py-1 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm text-black">
          Documentation
        </p>
        <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-tight text-black">
          CLI Usage & Setup
        </h1>
        <p className="mt-3 max-w-2xl font-bold text-black">
          Learn how to install, configure, and use the EnvArmor CLI to scan and protect your repositories.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Install */}
          <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">1. Installation</h2>
            <p className="mt-2 text-sm font-bold text-gray-700">
              Build and link the CLI package globally on your system.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Navigate to CLI directory</p>
                <pre className="border-4 border-black bg-neo-bg p-3 font-mono text-xs font-bold text-black shadow-neo-sm">
                  cd envarmor
                </pre>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Install dependencies and compile</p>
                <pre className="border-4 border-black bg-neo-bg p-3 font-mono text-xs font-bold text-black shadow-neo-sm">
                  npm install && npm run build
                </pre>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Link package globally</p>
                <pre className="border-4 border-black bg-neo-bg p-3 font-mono text-xs font-bold text-black shadow-neo-sm">
                  npm link
                </pre>
              </div>
            </div>
          </section>

          {/* Step 2: Auth */}
          <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">2. Authentication</h2>
            <p className="mt-2 text-sm font-bold text-gray-700">
              Authenticate the CLI with your dashboard account using your API key.
            </p>
            <div className="mt-4 space-y-4">
              <p className="text-sm font-bold text-black">
                You can obtain your key from the{" "}
                <Link href="/settings" className="text-neo-accent underline decoration-2 hover:text-black">
                  Settings page
                </Link>.
              </p>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Log in via command line</p>
                <pre className="border-4 border-black bg-neo-bg p-3 font-mono text-xs font-bold text-black shadow-neo-sm">
                  envarmor login --key "YOUR_API_KEY_HERE"
                </pre>
              </div>
            </div>
          </section>

          {/* Step 3: Commands */}
          <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">3. CLI Commands</h2>
            <p className="mt-2 text-sm font-bold text-gray-700">
              Run scans, ignore secrets, or push/pull encrypted envs from the Vault.
            </p>

            <div className="mt-6 space-y-6">
              <div className="border-l-4 border-black pl-4">
                <h3 className="font-black uppercase text-sm">Scan current folder</h3>
                <p className="text-xs text-gray-600 mt-1">Scans unstaged/modified git files.</p>
                <pre className="mt-2 border-4 border-black bg-neo-bg p-2 font-mono text-xs font-bold text-black">
                  envarmor scan
                </pre>
              </div>

              <div className="border-l-4 border-black pl-4">
                <h3 className="font-black uppercase text-sm">Scan entire repository</h3>
                <p className="text-xs text-gray-600 mt-1">Scans all files ignoring patterns in gitignore.</p>
                <pre className="mt-2 border-4 border-black bg-neo-bg p-2 font-mono text-xs font-bold text-black">
                  envarmor scan -all
                </pre>
              </div>

              <div className="border-l-4 border-black pl-4">
                <h3 className="font-black uppercase text-sm">Switch or target project</h3>
                <p className="text-xs text-gray-600 mt-1">Specify project slug to upload stats/sync envs to that project.</p>
                <pre className="mt-2 border-4 border-black bg-neo-bg p-2 font-mono text-xs font-bold text-black">
                  envarmor scan --project "project-slug"
                </pre>
              </div>

              <div className="border-l-4 border-black pl-4">
                <h3 className="font-black uppercase text-sm">Ignoring False Positives</h3>
                <p className="text-xs text-gray-600 mt-1">Append ignore comment at the end of the line containing target secret.</p>
                <pre className="mt-2 border-4 border-black bg-neo-bg p-2 font-mono text-xs font-bold text-black">
                  const myKey = "..." // envarmor-ignore
                </pre>
              </div>

              <div className="border-l-4 border-black pl-4">
                <h3 className="font-black uppercase text-sm">Push/Pull Vault Envs</h3>
                <p className="text-xs text-gray-600 mt-1">Upload or download encrypted variables securely.</p>
                <pre className="mt-2 border-4 border-black bg-neo-bg p-2 font-mono text-xs font-bold text-black">
                  envarmor push
                  envarmor pull
                </pre>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border-8 border-black bg-black p-6 text-white shadow-neo-lg">
            <h2 className="text-xl font-black uppercase text-neo-secondary">Interactive Docs</h2>
            <p className="mt-2 text-sm font-bold text-gray-300">
              The EnvArmor CLI checks code using entropy detectors, regular expressions, and local validations to prevent exposure before a git commit occurs.
            </p>
            <div className="mt-6 border-2 border-white/20 p-4 font-mono text-xs text-white/60">
              <p>// CLI Version</p>
              <p className="mt-2 text-neo-secondary">$ envarmor --version</p>
              <p className="mt-1">v1.1.2</p>
            </div>
          </div>

          <div className="border-8 border-black bg-neo-secondary p-6 shadow-neo-lg">
            <h2 className="text-xl font-black uppercase text-black">Syncing Envs</h2>
            <p className="mt-2 text-sm font-bold text-black">
              When pushing or pulling variables from the CLI, the package automatically encrypts them locally using AES-256 before transferring to the cloud.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
