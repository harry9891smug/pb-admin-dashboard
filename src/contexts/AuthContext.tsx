"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  adminLogin, 
  adminLogout, 
  getCurrentUser, 
  isAuthenticated, 
  validateSession,
  clearAllAuthData,
  type User 
} from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = getCurrentUser();
        const authenticated = isAuthenticated() && validateSession();
        const publicPaths = ['/login', '/admin/login', '/forgot-password'];
        const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
        const adminPaths = ['/admin', '/dashboard'];
        const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
        
        if (authenticated) {
          setUser(currentUser);
          if (isPublicPath) {
            router.push('/admin/dashboard');
          }
        } else {
          setUser(null);
          if (isAdminPath) {
            clearAllAuthData();
            const loginUrl = `/admin/login?redirect=${encodeURIComponent(pathname)}`;
            router.push(loginUrl);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        
        clearAllAuthData();
        
        if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
          router.push('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pb_admin_user' || e.key === 'pb_admin_access_token') {
        checkAuth();
      }
    };
    
    const handleRouteChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await adminLogin({ email, password });
      setUser(result.user);
      
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/admin/dashboard';
      router.push(redirectTo);
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    try {
      adminLogout();
      setUser(null);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const isAuth = isAuthenticated() && validateSession() && user !== null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      isAuthenticated: isAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}