"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showTop, setShowTop] = React.useState(false);
  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen pb-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden pb-app-bg text-gray-900 flex">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main
          ref={mainRef}
          onScroll={(e) => setShowTop(e.currentTarget.scrollTop > 400)}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
        >
          <div className="pb-fade-up pb-page-root">{children}</div>
        </main>
        {showTop && (
          <button
            onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-30 h-11 w-11 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 flex items-center justify-center text-lg"
            aria-label="Back to top"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
