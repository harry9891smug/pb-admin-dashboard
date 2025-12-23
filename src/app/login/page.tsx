"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from "react-hot-toast";

export default function AdminLoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
          <img
            src="/logo.png"  // <-- apna file name (public/ ke andar)
            alt="PromoBandhu Admin"
            className="h-16 w-auto"
          />
        </div>

          <h1 className="text-2xl font-bold text-slate-100 mb-2">
            PromoBandhu Admin
          </h1>
          <p className="text-sm text-slate-400">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 pr-10 text-sm text-slate-100 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={demoLogin}
            disabled={isSubmitting}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use demo credentials
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            For security reasons, access is restricted to authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}