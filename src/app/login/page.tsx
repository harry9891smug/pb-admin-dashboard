"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import {
  Eye,
  EyeOff,
  BadgePercent,
  ReceiptText,
  Users,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { toast } from "react-hot-toast";

const features = [
  { icon: BadgePercent, title: "Offers & ads", text: "Approve, schedule and track every campaign" },
  { icon: ReceiptText, title: "Billing & invoices", text: "Subscriptions, payments and GST in one view" },
  { icon: Users, title: "Businesses & teams", text: "Support tools and access control built in" },
];

// Inner component that uses useSearchParams
function LoginContent() {
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // REMOVED: useSearchParams() - temporary fix
  // const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Temporary: Direct redirect without searchParams
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      toast.success("Login successful!");
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const demoLogin = () => {
    setEmail("admin@promobandhu.com");
    setPassword("admin123");
  };

  if (loading) {
    return (
      <div className="pb-login-bg flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-violet-400 border-t-transparent"></div>
          <p className="text-sm text-violet-200">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="pb-login-bg relative min-h-screen overflow-hidden">
      {/* Background: aurora orbs + fine grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="pb-orb-a absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-fuchsia-600/30 blur-[110px]" />
        <div className="pb-orb-b absolute -right-24 bottom-0 h-[460px] w-[460px] rounded-full bg-violet-600/35 blur-[120px]" />
        <div className="pb-orb-a absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-emerald-500/20 blur-[100px]" />
        <div className="pb-login-grid absolute inset-0" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-12">
        {/* ---------------- Brand side ---------------- */}
        <div className="pb-rise hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-2xl shadow-black/40">
              <img src="/logo.png" alt="PromoBandhu" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight text-white">PromoBandhu</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300">Admin Console</div>
            </div>
          </div>

          <h2 className="mt-12 max-w-xl text-[2.9rem] font-extrabold leading-[1.08] tracking-tight text-white">
            Run every shop on{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              PromoBandhu
            </span>{" "}
            from one place.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-violet-200/80">
            Offers, billing, support and growth tools for thousands of local businesses — managed by your team,
            securely.
          </p>

          <ul className="mt-10 max-w-md space-y-3">
            {features.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="pb-glass pb-rise flex items-center gap-4 rounded-2xl p-3.5"
                style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-900/50">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="block text-xs text-violet-200/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* floating "live" cards */}
          <div className="relative mt-12 h-36 max-w-md">
            <div className="pb-glass pb-bob absolute left-0 top-2 w-52 rounded-2xl p-4" style={{ ["--r" as any]: "-3deg" }}>
              <div className="flex items-center justify-between text-[11px] font-medium text-violet-200">
                <span>Revenue</span>
                <TrendingUp className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="mt-1 text-2xl font-extrabold text-white">₹4.2L</div>
              <svg viewBox="0 0 120 32" className="mt-1 h-8 w-full">
                <defs>
                  <linearGradient id="lg1" x1="0" x2="1">
                    <stop offset="0" stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#6ee7b7" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#lg1)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,26 16,20 32,23 50,12 68,16 86,7 104,10 120,3"
                />
              </svg>
            </div>

            <div className="pb-glass pb-bob-2 absolute left-48 top-10 w-48 rounded-2xl p-4" style={{ ["--r" as any]: "2deg" }}>
              <div className="flex items-center gap-2 text-[11px] font-medium text-violet-200">
                <Sparkles className="h-4 w-4 text-fuchsia-300" /> New offers today
              </div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-2xl font-extrabold text-white">128</span>
                <span className="mb-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  +12%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Form side ---------------- */}
        <div className="pb-rise mx-auto w-full max-w-md" style={{ animationDelay: "0.1s" }}>
          {/* mobile brand */}
          <div className="mb-7 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-xl shadow-black/40">
              <img src="/logo.png" alt="PromoBandhu" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold text-white">PromoBandhu</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">Admin Console</div>
            </div>
          </div>

          <div className="relative">
            {/* glow behind the card */}
            <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-violet-500/60 via-fuchsia-500/30 to-emerald-400/40 opacity-70 blur-xl" />

            <form
              onSubmit={handleSubmit}
              className="pb-glass relative space-y-5 rounded-[1.75rem] p-7 shadow-2xl shadow-black/40 sm:p-9"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-violet-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Secure sign-in
                </span>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Welcome back</h1>
                <p className="mt-1.5 text-sm text-violet-200/70">Sign in to continue to your dashboard.</p>
              </div>

              <div>
                {/* "flex" not "block": a global label.block rule would recolour this */}
                <label className="mb-1.5 flex text-xs font-semibold uppercase tracking-wider text-violet-200/80">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/70" />
                  <input
                    type="email"
                    className="pb-login-input"
                    placeholder="you@promobandhu.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex text-xs font-semibold uppercase tracking-wider text-violet-200/80">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/70" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="pb-login-input pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-violet-300/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    disabled={isSubmitting}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="pb-shine group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-900/50 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={demoLogin}
                disabled={isSubmitting}
                className="w-full text-center text-xs font-medium text-violet-300/70 transition hover:text-white disabled:opacity-50"
              >
                Use demo credentials
              </button>
            </form>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-violet-300/60">
            <ShieldCheck className="h-3.5 w-3.5" />
            Access is restricted to authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense
export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="pb-login-bg flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-violet-400 border-t-transparent"></div>
          <p className="text-sm text-violet-200">Loading login page...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
