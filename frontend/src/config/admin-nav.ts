import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Activity,
  Globe,
  GraduationCap,
  Building2,
  Target,
  BookOpen,
  HelpCircle,
  FolderKanban,
  FileCheck,
  Users,
  Bell,
  BrainCircuit,
  CreditCard,
  Wallet,
  Receipt,
  TrendingUp,
  BarChart3,
  ScrollText,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: "Segera";
}

export interface AdminNavGroup {
  title: string;
  icon: LucideIcon;
  collapsible: boolean;
  roles: UserRole[];
  items: AdminNavItem[];
}

export const DASHBOARD_BY_ROLE: Partial<Record<UserRole, AdminNavItem>> = {
  SUPER_ADMIN: { title: "Dashboard Admin", href: "/admin", icon: ShieldCheck, roles: ["SUPER_ADMIN", "STAFF"] },
  STAFF: { title: "Dashboard Staff", href: "/staff", icon: ShieldCheck, roles: ["SUPER_ADMIN", "STAFF"] },
  GURU: { title: "Dashboard Guru", href: "/guru", icon: GraduationCap, roles: ["SUPER_ADMIN", "GURU"] },
  FINANCE: { title: "Dashboard Finance", href: "/finance", icon: TrendingUp, roles: ["SUPER_ADMIN", "FINANCE"] },
  INVESTOR: { title: "Investor Board", href: "/investor", icon: BarChart3, roles: ["SUPER_ADMIN", "INVESTOR"] },
};

const KONFIG: AdminNavGroup = {
  title: "Konfigurasi Umum",
  icon: Activity,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF"],
  items: [
    { title: "Monitoring & Config", href: "/admin/monitor-config", icon: Activity, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Health Monitor", href: "/admin/health", icon: Activity, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "CMS", href: "/admin/cms", icon: Globe, roles: ["SUPER_ADMIN", "STAFF"] },
  ],
};

const MASTER: AdminNavGroup = {
  title: "Master Akademik",
  icon: GraduationCap,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF"],
  items: [
    { title: "Akademik (Level/Grade)", href: "/admin/academic", icon: GraduationCap, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Kelola Sekolah", href: "/staff/schools", icon: Building2, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Target Sekolah", href: "/staff/target-schools", icon: Target, roles: ["SUPER_ADMIN", "STAFF"] },
  ],
};

const KONTEN: AdminNavGroup = {
  title: "Konten & Ujian",
  icon: BookOpen,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF", "GURU"],
  items: [
    { title: "Materi Pelajaran", href: "/admin/materials", icon: BookOpen, roles: ["SUPER_ADMIN", "STAFF", "GURU"] },
    { title: "Bank Soal", href: "/admin/questions", icon: FileCheck, roles: ["SUPER_ADMIN", "STAFF", "GURU"] },
    { title: "Media", href: "/guru/media", icon: FolderKanban, roles: ["SUPER_ADMIN", "STAFF", "GURU"] },
    { title: "Kelola Ujian", href: "/admin/exams", icon: FileCheck, roles: ["SUPER_ADMIN", "STAFF", "GURU"] },
  ],
};

const PENGGUNA: AdminNavGroup = {
  title: "Pengguna & Komunikasi",
  icon: Users,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF"],
  items: [
    { title: "Kelola Pengguna", href: "/admin/users", icon: Users, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Broadcast Notifikasi", href: "/staff/notifications", icon: Users, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "AI & Asisten", href: "/staff/ai", icon: BrainCircuit, roles: ["SUPER_ADMIN", "STAFF"] },
  ],
};

const FINANCE: AdminNavGroup = {
  title: "Finance & Membership",
  icon: CreditCard,
  collapsible: true,
  roles: ["SUPER_ADMIN", "FINANCE"],
  items: [
    { title: "Paket Membership", href: "/finance/plans", icon: CreditCard, roles: ["SUPER_ADMIN", "FINANCE"] },
    { title: "Pelanggan", href: "/finance/subscribers", icon: Users, roles: ["SUPER_ADMIN", "FINANCE"] },
    { title: "Pembayaran & Invoice", href: "/finance/payments", icon: Receipt, roles: ["SUPER_ADMIN", "FINANCE"] },
    { title: "Transaksi", href: "/finance/transactions", icon: Wallet, roles: ["SUPER_ADMIN", "FINANCE"] },
    { title: "Payout", href: "/finance/payouts", icon: Wallet, roles: ["SUPER_ADMIN", "FINANCE"] },
    { title: "Laporan Keuangan", href: "/finance/reports", icon: TrendingUp, roles: ["SUPER_ADMIN", "FINANCE"] },
  ],
};

const ANALISIS: AdminNavGroup = {
  title: "Analisis & Laporan",
  icon: BarChart3,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF", "FINANCE", "INVESTOR"],
  items: [
    { title: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Investor Board", href: "/investor", icon: BarChart3, roles: ["SUPER_ADMIN", "INVESTOR"] },
    { title: "Financial Reports", href: "/investor/reports", icon: TrendingUp, roles: ["SUPER_ADMIN", "INVESTOR"] },
  ],
};

const SISTEM: AdminNavGroup = {
  title: "Sistem",
  icon: ScrollText,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF"],
  items: [
    { title: "Audit Log", href: "/staff/audit", icon: ScrollText, roles: ["SUPER_ADMIN", "STAFF"] },
  ],
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [KONFIG, MASTER, KONTEN, PENGGUNA, FINANCE, ANALISIS, SISTEM];

export function getAdminNav(role: UserRole): AdminNavGroup[] {
  const dash = DASHBOARD_BY_ROLE[role];
  const groups: AdminNavGroup[] = [];
  for (const g of ADMIN_NAV_GROUPS) {
    const items = g.items.filter((i) => i.roles.includes(role));
    if (!items.length) continue;
    groups.push({ ...g, items, roles: g.roles.filter((r) => r === role) });
  }
  if (dash) {
    groups.unshift({ title: "Dashboard", icon: dash.icon, collapsible: false, roles: [role], items: [dash] });
  }
  return groups;
}

export function isNavActive(href: string, pathname: string): boolean {
  const isDashboard = ["/admin", "/staff", "/guru", "/finance", "/investor", "/"].includes(href);
  return isDashboard ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveNav(groups: AdminNavGroup[], pathname: string): { group: AdminNavGroup; item: AdminNavItem } | null {
  for (const g of groups) {
    for (const item of g.items) {
      if (isNavActive(item.href, pathname)) return { group: g, item };
    }
  }
  return null;
}

export function flattenNav(groups: AdminNavGroup[]): AdminNavItem[] {
  return groups.flatMap((g) => g.items);
}

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin",
  STAFF: "/staff",
  GURU: "/guru",
  FINANCE: "/finance",
  INVESTOR: "/investor",
  SISWA: "/siswa",
  SUPER_SISWA: "/siswa",
};

export function dashboardHref(role: UserRole): string {
  return DASHBOARD_ROUTES[role] || "/login";
}