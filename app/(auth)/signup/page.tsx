"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [logoFallback, setLogoFallback] = useState(false);

  const handleGithubSignup = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo }
      });

      if (error) {
        setMessage(error.message);
        setIsError(true);
        return;
      }
    } catch (err: any) {
      if (err.message?.includes("Failed to fetch") || err.name === "TypeError") {
        setMessage("Connection to Supabase failed. Please verify your internet connection and Supabase URL in .env.");
      } else {
        setMessage(err.message || "An unexpected error occurred.");
      }
      setIsError(true);
    }
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const redirectTo = `${window.location.origin}/auth/callback`;
    setMessage("");
    setIsError(false);

    try {
      // 1. Check if email is already registered
      const checkRes = await fetch("/api/v1/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setMessage("This email is already registered. Please log in instead.");
          setIsError(true);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to check email registration:", err);
    }

    // 2. Call Supabase OTP
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) {
        if (error.status === 429 || error.message?.toLowerCase().includes("rate limit") || error.message?.toLowerCase().includes("too many requests")) {
          setMessage("Too many verification attempts. Please wait 60 seconds before trying again.");
        } else {
          setMessage(error.message);
        }
        setIsError(true);
        return;
      }

      setMessage("Verification link sent. Check your inbox to create your account.");
      setIsError(false);
    } catch (err: any) {
      if (err.status === 429 || err.message?.toLowerCase().includes("rate limit") || err.message?.toLowerCase().includes("too many requests")) {
        setMessage("Too many verification attempts. Please wait 60 seconds before trying again.");
      } else if (err.message?.includes("Failed to fetch") || err.name === "TypeError") {
        setMessage("Connection to Supabase failed. Please verify your internet connection and Supabase URL in .env.");
      } else {
        setMessage(err.message || "An unexpected error occurred.");
      }
      setIsError(true);
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <main className="relative min-h-screen overflow-hidden bg-neo-bg bg-halftone px-4 py-8 text-neo-ink md:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <m.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-lg"
          >
            <div className="absolute -left-4 -top-4 rotate-[-8deg] border-4 border-black bg-neo-accent px-3 py-2 text-white shadow-neo-sm">
              <p className="text-xs font-black uppercase tracking-[0.35em]">New Account</p>
            </div>

            <div className="border-8 border-black bg-white shadow-neo-xl">
              <div className="flex items-center justify-between border-b-4 border-black bg-neo-secondary px-5 py-4">
                <div className="flex items-center gap-3">
                  <Link href="/" className="inline-block">
                    {!logoFallback ? (
                      <Image
                        src="/EnvGuard.png"
                        alt="EnvArmor"
                        width={120}
                        height={40}
                        className="h-8 w-auto"
                        onError={() => setLogoFallback(true)}
                      />
                    ) : (
                      <span className="block font-black text-sm uppercase tracking-[0.35em]">EnvArmor</span>
                    )}
                  </Link>
                </div>
                <Sparkles className="h-6 w-6 stroke-[3px] text-black" />
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <div className="text-center">
                  <h1 className="text-3xl font-black uppercase tracking-tight">Join the Armor</h1>
                  <p className="mt-2 font-bold text-sm">Secure your secrets in seconds.</p>
                </div>

                <button
                  type="button"
                  onClick={handleGithubSignup}
                  className="flex w-full items-center justify-between gap-4 border-4 border-black bg-black px-5 py-4 text-left font-black uppercase tracking-widest text-white shadow-neo-md transition-all duration-100 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <span className="flex items-center gap-3">
                    <GitBranch className="h-8 w-8 stroke-[3px] text-neo-secondary" />
                    Sign up with GitHub
                  </span>
                  <ArrowRight className="h-6 w-6 stroke-[3px] text-neo-secondary" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-4 flex-1 border-b-4 border-black" />
                  <span className="rotate-[-3deg] border-4 border-black bg-neo-muted px-3 py-1 text-xs font-black uppercase tracking-[0.35em] shadow-neo-sm">
                    Or use email
                  </span>
                  <div className="h-4 flex-1 border-b-4 border-black" />
                </div>

                <form onSubmit={handleMagicLink} className="space-y-4">
                  <label htmlFor="email" className="block text-xs font-black uppercase tracking-[0.35em]">
                    Work email
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
                    Create Account
                  </button>
                </form>

                {message ? (
                  <div
                    className={`border-4 border-black px-4 py-4 font-bold shadow-neo-sm ${
                      isError ? "bg-neo-accent text-white" : "bg-neo-secondary text-black"
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.35em]">{isError ? "Error" : "Status"}</p>
                    <p className="mt-2 leading-relaxed">{message}</p>
                    {isError && (
                      <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="mt-4 block w-full border-4 border-black bg-white px-4 py-2 text-center text-xs font-black uppercase tracking-widest text-black shadow-neo-sm hover:bg-neo-secondary"
                      >
                        Dev Bypass (Enter as Guest)
                      </button>
                    )}
                  </div>
                ) : null}

                <div className="border-t-4 border-black pt-5 text-center">
                  <p className="text-sm font-bold">
                    Already have an account?{" "}
                    <Link href="/login" className="text-neo-accent underline decoration-4 underline-offset-4 hover:text-black">
                      Log In
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </m.section>
        </div>
      </main>
    </LazyMotion>
  );
}
