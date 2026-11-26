"use client";

import { useAuth } from "@/contexts/AuthContext";

// Button / section level permission check. The backend still enforces every
// permission on each request; this only hides what the user can't use.
export function useCan() {
  const { user } = useAuth();
  const perms = (user?.permissions ?? []) as string[];
  return (key?: string) => !key || perms.includes(key);
}
