import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Safely delete duplicate/deprecated app/dashboard/page.tsx to prevent routing conflicts
try {
  const oldDashboardPage = path.join(process.cwd(), "app", "dashboard", "page.tsx");
  if (fs.existsSync(oldDashboardPage)) {
    fs.unlinkSync(oldDashboardPage);
    console.log("🧹 [Startup] Deleted duplicate app/dashboard/page.tsx");
  }
} catch (err) {
  console.error("🧹 [Startup] Error deleting duplicate app/dashboard/page.tsx:", err);
}

// Automatically compile CLI locally when Next.js starts or hot-reloads
if (!process.env.VERCEL) {
  try {
    console.log("🛠 [Startup] Building CLI package...");
    execSync("npm run cli:build", { stdio: "inherit" });
    console.log("✅ [Startup] CLI package compiled successfully!");
  } catch (err) {
    console.error("❌ [Startup] Failed to build CLI:", err);
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true
};

export default nextConfig;
