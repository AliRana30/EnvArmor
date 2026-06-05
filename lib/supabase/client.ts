"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window === "undefined") {
      // Return a dummy client during build-time prerendering to prevent build crashes
      return createBrowserClient("https://placeholder-project.supabase.co", "placeholder-key");
    }
    throw new Error("Missing Supabase env vars. Check .env.local");
  }

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    throw new Error("SUPABASE_URL malformed: " + url);
  }

  return createBrowserClient(url, key);
}
