"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { dashboardHref } from "@/config/admin-nav";

const ALLOWED: Record<string, readonly string[]> = {
  "(admin)": ["SUPER_ADMIN", "STAFF"],
  "(staff)": ["SUPER_ADMIN", "STAFF"],
  "(guru)": ["SUPER_ADMIN", "GURU"],
  "(finance)": ["SUPER_ADMIN", "FINANCE"],
  "(investor)": ["SUPER_ADMIN", "INVESTOR"],
};

export function AdminGuard({ area, children }: { area: keyof typeof ALLOWED; children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) { router.replace("/login"); return; }
    if (user.role === "SISWA" || user.role === "SUPER_SISWA") { router.replace("/siswa"); return; }
    if (!ALLOWED[area].includes(user.role)) router.replace(dashboardHref(user.role));
  }, [isLoading, isAuthenticated, user, area, router]);

  if (isLoading || !user) return null;
  return <>{children}</>;
}