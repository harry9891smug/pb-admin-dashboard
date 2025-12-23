"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
    
    if (!loading && isAuthenticated && adminOnly && user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, loading, router, user, adminOnly]);

  if (loading || !isAuthenticated) {
    return null; 
  }

  if (adminOnly && user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}