# EnvArmor: Secret Leak Prevention Suite

EnvArmor is a comprehensive security suite designed to detect, manage, and protect your environment variables and sensitive credentials. It combines a high-performance, offline-first Command Line Interface (CLI) with a web dashboard, ensuring your credentials never leak into git history, AI context windows, or public repositories.

---

## The Problem vs. The Solution

| The Problem | The EnvArmor Solution |
| :--- | :--- |
| Secrets leaked in `.env` files or git history. | Real-time pre-commit scanning. |
| Accidental exposure to AI tools (ChatGPT/Claude) via codebases. | AI Context Protection ignore rule generation. |
| No clarity on which leaked key is most critical/costly. | Financial Risk Estimation metrics. |
| Teams struggling to sync `.env.local` files securely. | Encrypted Cloud Vault for syncing environments. |

---

## Tech Stack

### Web Dashboard
- **Framework**: Next.js 15 (App Router)
- **Authentication**: Supabase Auth
- **Database**: Prisma ORM + Supabase PostgreSQL
- **Caching & State**: Upstash Redis
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Styling**: Vanilla CSS / Tailwind CSS

### CLI (Core)
- **Runtime**: Node.js (TypeScript)
- **Parsing**: Commander.js
- **Styling**: Chalk
- **Detection**: Regex Patterns + Shannon Entropy Analysis + Context Verification

---

## Setup and Usage

### Section 1: GitHub Clone & Development Setup (Web Dashboard)
Use this setup to run the EnvArmor web dashboard and local database sync server.

1. Clone the repository:
   ```bash
   git clone https://github.com/AliRana30/EnvArmor.git
   cd EnvArmor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```
   *(Ensure you fill in your database credentials and Supabase configurations in `.env`)*

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the local development server:
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:3000`.

---

### Section 2: CLI Tool Installation & Local Usage
Use this setup to build and link the CLI locally from the source files.

1. Navigate to the CLI subdirectory:
   ```bash
   cd envarmor
   ```

2. Install dependencies and compile the CLI:
   ```bash
   npm install
   npm run build
   ```

3. Link the package globally so you can use the `envarmor` command anywhere:
   ```bash
   npm link
   ```

4. Authenticate the CLI with your local server:
   - Copy your API key from the Web Settings page (`http://localhost:3000/settings`).
   - Run the login command:
     ```bash
     envarmor login --key "YOUR_API_KEY_HERE"
     ```
     *(Note: The CLI defaults to the local dashboard `http://localhost:3000/api/v1` for easy local testing. To override, set the `ENVARMOR_API_BASE_URL` environment variable).*

5. Run a scan in any repository:
   ```bash
   envarmor scan -all
   ```

---

### Section 3: NPM Package Integration (Direct Use in New Projects)
If you want to use EnvArmor directly as an NPM package dependency inside a new project without cloning the dashboard repo:

1. **Install the package**:
   Once published to npm (or linked locally), run:
   ```bash
   npm install envarmor
   ```

2. **Initialize in your project**:
   Run the init command inside your project root to automatically generate the pre-commit hook and `.envarmor` config file:
   ```bash
   npx envarmor init
   ```

3. **Programmatic Usage**:
   You can import the scanner engine directly in your Node.js/TypeScript code:
   ```typescript
   import { ScannerEngine } from 'envarmor/src/engine.js';
   import { RegexDetector, EntropyDetector } from 'envarmor/src/detectors.js';

   const engine = new ScannerEngine({
     cwd: process.cwd(),
     detectors: [new RegexDetector(), new EntropyDetector()]
   });

   const result = await engine.scan();
   console.log(`Scanned ${result.filesScanned} files. Found ${result.findings.length} secrets.`);
   ```

4. **Package Executables**:
   You can invoke scan, AI-protect, or vault commands directly via `npx`:
   ```bash
   npx envarmor scan --all
   npx envarmor protect
   npx envarmor pull --env development
   ```

---

## Command Reference Index

| Command | Option Flags | Description |
| :--- | :--- | :--- |
| `envarmor init` | None | Installs the Git pre-commit hooks and creates a local project configuration. |
| `envarmor scan` | `-all` / `--all`<br>`--staged`<br>`--history` | Scans the workspace files for secrets.<br>`-all` (default) scans all files.<br>`--staged` scans files ready for commit.<br>`--history` audits git commits, reflogs, and stashes. |
| `envarmor login` | `--key <api-key>` | Authenticates your local CLI with your web dashboard account. |
| `envarmor protect` | None | Generates AI-ignore rule configurations (`.cursorignore`, `.claudeignore`, `.aiexclude`, `.github/copilot-instructions.md`) and updates `.gitignore`. |
| `envarmor audit-ai` | None | Verifies if active AI developers/extensions are configured to see your secrets. |
| `envarmor sanitize` | `<text>` | Redacts potential secrets from a string of text. |
| `envarmor push` | `--env <env>` / `--force` | Uploads local environment variables from `.env.local` to the vault. `--force` overwrites existing remote values. |
| `envarmor pull` | `--env <env>` / `--output <out>` | Pulls secrets from the vault. Output options: `shell` (prints to stdout) or `file` (writes to `.env`). |
| `envarmor uninstall` | None | Uninstalls the pre-commit hook and cleans up configuration settings. |

---

## Global Git Hooks (Auto-Implementation)

By default, `envarmor init` installs a pre-commit hook locally inside the current repository's `.git/hooks/` directory. If you want Git to automatically implement the EnvArmor pre-commit hook globally for all current and future projects on your system, configure Git to use a global hooks template:

1. Create a global templates folder:
   ```bash
   mkdir -p ~/.git-templates/hooks
   ```

2. Copy the hook script:
   Copy the `pre-commit` script generated by `envarmor init` into the newly created global hooks directory:
   ```bash
   cp .git/hooks/pre-commit ~/.git-templates/hooks/pre-commit
   ```

3. Configure Git globally:
   Tell Git to use this directory as a template for all repositories and resolve hooks from it:
   ```bash
   git config --global init.templatedir '~/.git-templates'
   git config --global core.hooksPath ~/.git-templates/hooks
   ```

---

## Advantages

1. **Local Security**: Key scanning is executed entirely on your machine. Only lightweight metadata reports are dispatched to the dashboard.
2. **Speed**: High-speed Node/TypeScript scanner completing runs in milliseconds.
3. **Financial Awareness**: Financial analysis prioritizes remediation efforts based on actual business cost at risk.
4. **CI/CD Integration**: Optimized logs for automated workflows (`npx envarmor scan --ci --fail-on-high`).


<p>Made with ❤️ by Ali Mahmood Rana</p>