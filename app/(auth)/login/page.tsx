"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [logoFallback, setLogoFallback] = useState(false);

  const handleGithubLogin = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const loadingToast = toast.loading("Redirecting to GitHub...");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo }
      });

      toast.dismiss(loadingToast);
      if (error) throw error;
    } catch (err: any) {
      toast.dismiss(loadingToast);
      setIsError(true);
      if (err.message === "Failed to fetch" || err.message?.includes("fetch")) {
        const errorMsg = "Cannot reach auth server. Check your Supabase project is active.";
        toast.error(errorMsg);
        setMessage(errorMsg);
      } else {
        toast.error(err.message || "An unexpected error occurred.");
        setMessage(err.message || "An unexpected error occurred.");
      }
    }
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const loadingToast = toast.loading("Sending magic link...");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      toast.dismiss(loadingToast);
      if (error) throw error;

      toast.success("Magic link sent! Check your inbox.");
      setMessage("Check your email for the login link.");
      setIsError(false);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      setIsError(true);
      if (err.message === "Failed to fetch" || err.message?.includes("fetch")) {
        const errorMsg = "Cannot reach auth server. Check your Supabase project is active.";
        toast.error(errorMsg);
        setMessage(errorMsg);
      } else {
        toast.error(err.message || "An unexpected error occurred.");
        setMessage(err.message || "An unexpected error occurred.");
      }
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <main className="relative min-h-screen overflow-hidden bg-neo-bg bg-halftone px-4 py-8 text-neo-ink flex items-center justify-center">
        {/* Background shapes (subtle) */}
        <div className="absolute left-6 top-8 hidden h-24 w-24 border-4 border-black bg-neo-secondary shadow-neo-md lg:block" />
        <div className="absolute right-10 top-16 hidden h-16 w-16 -rotate-12 border-4 border-black bg-neo-accent shadow-neo-sm lg:block" />
        <div className="absolute bottom-10 left-10 hidden h-14 w-14 rotate-6 border-4 border-black bg-neo-muted shadow-neo-sm lg:block" />

        <m.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          <div className="border-8 border-black bg-white shadow-neo-xl">
            {/* Header / Logo Only */}
            <div className="flex items-center justify-center border-b-4 border-black bg-neo-secondary px-5 py-6">
              <div className="border-4 border-black bg-white px-4 py-2 shadow-neo-sm">
                {!logoFallback ? (
                  <Image
                    src="/EnvGuard.png"
                    alt="EnvArmor"
                    width={150}
                    height={50}
                    className="h-10 w-auto"
                    onError={() => setLogoFallback(true)}
                    priority
                  />
                ) : (
                  <span className="block font-black text-lg uppercase tracking-[0.35em]">EnvArmor</span>
                )}
              </div>
            </div>

            <div className="space-y-6 p-6 md:p-10">
              <button
                type="button"
                onClick={handleGithubLogin}
                className="flex w-full items-center justify-between gap-4 border-4 border-black bg-black px-5 py-4 text-left font-black uppercase tracking-widest text-white shadow-neo-md transition-all duration-100 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <span className="flex items-center gap-3">
                  <GitBranch className="h-8 w-8 stroke-[3px] text-neo-secondary" />
                  Continue with GitHub
                </span>
                <ArrowRight className="h-6 w-6 stroke-[3px] text-neo-secondary" />
              </button>

              <div className="flex items-center gap-3">
                <div className="h-4 flex-1 border-b-4 border-black" />
                <span className="rotate-[-3deg] border-4 border-black bg-neo-muted px-3 py-1 text-xs font-black uppercase tracking-[0.35em] shadow-neo-sm">
                  Or
                </span>
                <div className="h-4 flex-1 border-b-4 border-black" />
              </div>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-[0.35em]">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="h-14 w-full border-4 border-black bg-neo-bg px-4 font-bold text-base outline-none transition-all duration-100 placeholder:font-bold placeholder:text-black focus:bg-neo-secondary"
                />
                <button
                  type="submit"
                  className="w-full border-4 border-black bg-neo-accent px-5 py-4 font-black uppercase tracking-widest text-white shadow-neo-md transition-all duration-100 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Send Magic Link
                </button>
              </form>

              {message ? (
                <div
                  className={`border-4 border-black px-4 py-4 font-bold shadow-neo-sm ${
                    isError ? "bg-neo-accent text-white" : "bg-neo-secondary text-black"
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.35em]">{isError ? "Auth error" : "Auth status"}</p>
                  <p className="mt-2 leading-relaxed">{message}</p>
                  {isError && (
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="mt-4 block w-full border-4 border-black bg-white px-4 py-2 text-center text-xs font-black uppercase tracking-widest text-black shadow-neo-sm hover:bg-neo-secondary"
                    >
                      Developer Bypass (Enter as Guest)
                    </button>
                  )}
                </div>
              ) : null}

              <div className="mt-4 text-center">
                <p className="text-sm font-bold text-gray-500">
                  Don't have an account?{" "}
                  <button onClick={() => window.location.href='/signup'} type="button" className="text-neo-accent underline decoration-4 underline-offset-4 hover:text-black">
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </m.section>
      </main>
    </LazyMotion>
  );
}
