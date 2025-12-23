"use client";
import { useAuth } from '@/contexts/AuthContext';
export default function AuthLoader() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Checking authentication...</p>
          <p className="text-slate-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return null;
}