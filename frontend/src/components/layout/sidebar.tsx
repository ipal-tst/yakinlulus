"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/admin";
import {
    BookOpen,
    FileCheck,
    Bell,
    LayoutDashboard,
    HelpCircle,
    Users,
    Building2,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    GraduationCap,
    PenTool,
    Trophy,
    Award,
    Target,
    Bot,
    FolderKanban,
    Receipt,
    TrendingUp,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    roles?: UserRole[];
}

const SISWA_NAV: NavItem[] = [
    { title: "Beranda", href: "/siswa", icon: LayoutDashboard },
    { title: "Belajar", href: "/materials", icon: BookOpen },
    { title: "Latihan", href: "/practice", icon: PenTool },
    { title: "Try Out", href: "/exams", icon: FileCheck },
    { title: "Hasil", href: "/results", icon: Trophy },
    { title: "Peringkat", href: "/ranking", icon: Award },
    { title: "Target Saya", href: "/targets", icon: Target },
    { title: "Sertifikat", href: "/certificates", icon: Award },
    { title: "AI Tutor", href: "/ai", icon: Bot },
];

const GURU_NAV: NavItem[] = [
    { title: "Dashboard Guru", href: "/guru", icon: LayoutDashboard },
    { title: "Bank Soal", href: "/guru/questions", icon: HelpCircle },
    { title: "Materi", href: "/guru/materials", icon: BookOpen },
    { title: "Kelola Ujian", href: "/guru/exams", icon: FileCheck },
    { title: "Media", href: "/guru/media", icon: FolderKanban },
];

const STAFF_NAV: NavItem[] = [
    { title: "Dashboard Staff", href: "/staff", icon: LayoutDashboard },
    { title: "Master Akademik", href: "/admin/academic", icon: GraduationCap },
    { title: "Kelola Sekolah", href: "/staff/schools", icon: Building2 },
    { title: "Materi Pelajaran", href: "/admin/materials", icon: BookOpen },
    { title: "Bank Soal", href: "/admin/questions", icon: HelpCircle },
    { title: "Kelola Ujian", href: "/admin/exams", icon: FileCheck },
    { title: "Kelola Pengguna", href: "/admin/users", icon: Users },
    { title: "Broadcast Notifikasi", href: "/staff/notifications", icon: Bell },
    { title: "Monitoring & Konfigurasi", href: "/admin/monitor-config", icon: Settings },
];

const FINANCE_NAV: NavItem[] = [
    { title: "Dashboard Finance", href: "/finance", icon: LayoutDashboard },
    { title: "Paket Membership", href: "/finance/plans", icon: Receipt },
    { title: "Pelanggan", href: "/finance/subscribers", icon: Users },
    { title: "Pembayaran & Invoice", href: "/finance/payments", icon: Receipt },
    { title: "Laporan Keuangan", href: "/finance/reports", icon: TrendingUp },
];

const INVESTOR_NAV: NavItem[] = [
    { title: "Investor Board", href: "/investor", icon: LayoutDashboard },
    { title: "Financial Reports", href: "/investor/reports", icon: TrendingUp },
];

const SUPER_ADMIN_NAV: NavItem[] = [
    { title: "Dashboard Admin", href: "/admin", icon: LayoutDashboard },
    { title: "Master Akademik", href: "/admin/academic", icon: GraduationCap },
    { title: "Kelola Sekolah", href: "/staff/schools", icon: Building2 },
    { title: "Materi Pelajaran", href: "/admin/materials", icon: BookOpen },
    { title: "Bank Soal", href: "/admin/questions", icon: HelpCircle },
    { title: "Kelola Ujian", href: "/admin/exams", icon: FileCheck },
    { title: "Kelola Pengguna", href: "/admin/users", icon: Users },
    { title: "Broadcast Notifikasi", href: "/staff/notifications", icon: Bell },
    { title: "Monitoring & Konfigurasi", href: "/admin/monitor-config", icon: Settings },
];

function SidebarContent({
    collapsed = false,
    onCollapseToggle,
    isMobile = false
}: {
    collapsed?: boolean;
    onCollapseToggle?: () => void;
    isMobile?: boolean;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const role = user?.role || "SISWA";

    let navItems: NavItem[] = SISWA_NAV;
    if (role === "GURU") navItems = GURU_NAV;
    if (role === "STAFF") navItems = STAFF_NAV;
    if (role === "SUPER_ADMIN") navItems = SUPER_ADMIN_NAV;
    if (role === "FINANCE") navItems = FINANCE_NAV;
    if (role === "INVESTOR") navItems = INVESTOR_NAV;

    const sidebarWidth = collapsed ? "w-[72px]" : "w-[280px]";

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col justify-between",
                !isMobile && "hidden md:flex",
                !isMobile && sidebarWidth,
                isMobile && "w-full"
            )}
        >
            <div>
                {/* Brand Header */}
                <div className="h-[72px] flex items-center justify-between px-4 border-b border-sidebar-border">
                    <Link
                        href={role === "SUPER_ADMIN" ? "/admin" :
                            role === "STAFF" ? "/staff" :
                                role === "GURU" ? "/guru" :
                                    role === "FINANCE" ? "/finance" :
                                        role === "INVESTOR" ? "/investor" :
                                            role === "SISWA" ? "/siswa" : "/"}
                        className="flex items-center gap-3 overflow-hidden"
                    >
                        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading text-xl shrink-0">
                            YL
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="font-heading font-bold text-lg leading-none text-foreground">
                                    YakinLulus<span className="text-primary">.id</span>
                                </span>
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    {role} Platform
                                </span>
                            </div>
                        )}
                    </Link>
                    {!isMobile && onCollapseToggle && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCollapseToggle}
                            className="h-8 w-8 text-muted-foreground shrink-0 hidden md:flex"
                        >
                            {collapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                    {navItems.map((item) => {
                        const isDashboardRoute = ["/admin", "/staff", "/guru", "/siswa", "/finance", "/investor", "/"].includes(item.href);
                        const isActive = isDashboardRoute
                            ? pathname === item.href
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                    collapsed && "justify-center px-0"
                                )}
                                title={collapsed ? item.title : undefined}
                            >
                                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "")} />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer Profile & Logout */}
            <div className="p-3 border-t border-sidebar-border">
                {!collapsed ? (
                    <div className="flex items-center justify-between gap-2 px-2 py-1">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                                {user?.full_name?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-xs font-semibold truncate text-foreground">
                                    {user?.full_name || "Pengguna"}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                    {user?.email || ""}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            title="Keluar"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="w-full h-10 text-muted-foreground hover:text-destructive"
                        title="Keluar"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </aside>
    );
}

function Sidebar() {
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    return (
        <>
            <SidebarContent collapsed={sidebarCollapsed} onCollapseToggle={toggleSidebar} />
            <MobileSidebar open={sidebarCollapsed} onOpenChange={toggleSidebar} />
        </>
    );
}

export function MobileSidebar({
    open,
    onOpenChange
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-[280px] p-0">
                <SidebarContent isMobile={true} />
            </SheetContent>
        </Sheet>
    );
}

export { Sidebar };
