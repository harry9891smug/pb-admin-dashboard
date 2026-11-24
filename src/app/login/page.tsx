"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, BadgePercent, ReceiptText, Users, ShieldCheck } from 'lucide-react';
import { toast } from "react-hot-toast";

const features = [
  { icon: BadgePercent, text: "Offers, ads and template images" },
  { icon: ReceiptText, text: "Subscriptions, billing and invoices" },
  { icon: Users, text: "Businesses, teams and support tools" },
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
      <div className="min-h-screen pb-app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-violet-500 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel (large screens) */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-400/20" />
        <div className="pointer-events-none absolute right-24 top-1/2 h-24 w-24 rotate-12 rounded-3xl bg-white/10" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
            <img src="/logo.png" alt="PromoBandhu" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold tracking-tight">PromoBandhu</span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
            Run every business on PromoBandhu from one place.
          </h2>
          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-violet-50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-violet-200">
          <ShieldCheck className="h-4 w-4" />
          Access is restricted to authorized personnel only
        </div>
      </div>

      {/* Form */}
      <div className="pb-app-bg flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <img src="/logo.png" alt="PromoBandhu" className="mx-auto mb-5 h-16 w-auto lg:hidden" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-500">Sign in to the PromoBandhu admin dashboard</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-900/5 sm:p-8"
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email address</label>
              <input
                type="email"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            <button
              type="button"
              onClick={demoLogin}
              disabled={isSubmitting}
              className="w-full text-center text-sm font-medium text-gray-500 transition hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use demo credentials
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400 lg:hidden">
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
      <div className="min-h-screen pb-app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-violet-500 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading login page...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
