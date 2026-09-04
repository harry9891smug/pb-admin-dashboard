"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  // The RBAC permission key this page requires (e.g. "business.view").
  // Checked against user.permissions, which comes straight from the login
  // response — the same array the backend already checks on every
  // /admin/* route. Leave unset for pages every logged-in admin should see
  // (there shouldn't be many of these).
  requiredPermission?: string;
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const hasPermission =
    !requiredPermission || (user?.permissions ?? []).includes(requiredPermission);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }

    if (!loading && isAuthenticated && adminOnly && user?.role !== 'admin') {
      router.push('/unauthorized');
    }

    if (!loading && isAuthenticated && !hasPermission) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, loading, router, user, adminOnly, hasPermission]);

  if (loading || !isAuthenticated) {
    return null;
  }

  if (adminOnly && user?.role !== 'admin') {
    return null;
  }

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
}