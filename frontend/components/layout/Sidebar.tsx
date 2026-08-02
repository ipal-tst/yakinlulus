"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BookOpen,
    HelpCircle,
    FileSpreadsheet,
    Users,
    Settings,
    Bot,
    ChevronLeft,
    ChevronRight,
    Database,
    Building2,
    CreditCard,
    BarChart3,
    Image as ImageIcon,
    ShieldAlert,
    Terminal,
    Trophy,
    UserCheck,
    X,
    ChevronDown,
} from "lucide-react";

interface SidebarProps {
    role?: "student" | "teacher" | "staff" | "admin";
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function Sidebar({ role = "student", isMobileOpen = false, onMobileClose }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

    // Persist & restore collapse state on desktop
    React.useEffect(() => {
        const saved = localStorage.getItem("yl_sidebar_collapsed");
        if (saved !== null) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("yl_sidebar_collapsed", String(next));
            return next;
        });
    };

    // Close mobile menu on page navigation
    React.useEffect(() => {
        if (isMobileOpen && onMobileClose) {
            onMobileClose();
        }
    }, [pathname]);

    const studentNavItems = [
        { label: "Beranda Siswa", href: "/student", icon: LayoutDashboard },
        { label: "Materi Belajar Hub", href: "/student/materials", icon: BookOpen },
        { label: "Latihan Soal Adaptif", href: "/student/practice", icon: HelpCircle },
        { label: "Ujian CBT & Tryout", href: "/student/exam", icon: FileSpreadsheet },
        { label: "AI Tutor Companion", href: "/student/ai-tutor", icon: Bot },
        { label: "Progress & IRT Analytics", href: "/student/analytics", icon: BarChart3 },
        { label: "Leaderboard & XP", href: "/student/leaderboard", icon: Trophy },
        { label: "Profil & Target Belajar", href: "/student/profile", icon: UserCheck },
    ];

    const teacherNavItems = [
        { label: "Teacher Command", href: "/teacher", icon: LayoutDashboard },
        { label: "Kelola Bank Soal", href: "/teacher/question-bank", icon: HelpCircle },
        { label: "Paket Ujian & Tryout", href: "/teacher/exam-packages", icon: FileSpreadsheet },
        { label: "Materi Pembelajaran", href: "/teacher/materials", icon: BookOpen },
    ];

    const staffNavItems = [
        { label: "Staff Command", href: "/staff", icon: LayoutDashboard },
        { label: "CBT Monitoring", href: "/staff/cbt", icon: FileSpreadsheet },
        { label: "Reports & Analytics", href: "/staff/reports", icon: BarChart3 },
        { label: "Academic Data (View)", href: "/staff/academic", icon: Database },
        { label: "User Data (View)", href: "/staff/users", icon: Users },
    ];

    const adminNavItems = [
        { label: "Command Center", href: "/admin", icon: LayoutDashboard },
        { label: "Master Data Akademik", href: "/admin/master-data", icon: Database },
        { label: "User & Role Access", href: "/admin/users", icon: Users },
        { label: "Bank Soal & FSM", href: "/admin/question-bank", icon: HelpCircle },
        { label: "Materi Pembelajaran", href: "/admin/materials", icon: BookOpen },
        { label: "CBT Exam Operations", href: "/admin/cbt", icon: FileSpreadsheet },
        { label: "Sekolah Mitra & Quota", href: "/admin/schools", icon: Building2 },
        { label: "Paket & Revenue MRR", href: "/admin/subscriptions", icon: CreditCard },
        {
            label: "Pengaturan Sistem", icon: Settings, children: [
                { label: "Analytics & Reports", href: "/admin/analytics", icon: BarChart3 },
                { label: "Konten & Banner CMS", href: "/admin/content", icon: ImageIcon },
                { label: "AI Tutor Companion", href: "/admin/ai-tutor", icon: Bot },
                { label: "API Documentation", href: "/admin/docs", icon: Terminal },
                { label: "Audit & Security Log", href: "/admin/audit-logs", icon: ShieldAlert },
            ]
        },
    ];

    const navItems =
        role === "admin"
            ? adminNavItems
            : role === "teacher"
                ? teacherNavItems
                : role === "staff"
                    ? staffNavItems
                    : studentNavItems;

    const roleTitle =
        role === "admin"
            ? "YakinLulus Admin CMS"
            : role === "teacher"
                ? "YakinLulus Teacher Suite"
                : role === "staff"
                    ? "YakinLulus Staff Ops"
                    : "YakinLulus Student Portal";

    const sidebarContent = (
        <div className="flex flex-col h-full justify-between">
            {/* Nav Header */}
            <div>
                <div className="flex items-center justify-between p-4 border-b md:hidden">
                    <span className="font-bold text-sm text-foreground capitalize">{role} Menu Navigation</span>
                    <button
                        onClick={onMobileClose}
                        className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground cursor-pointer"
                        aria-label="Tutup Menu"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 space-y-1 p-3">
                    {navItems.map((item: any) => {
                        const Icon = item.icon;
                        const isActive = item.href && (pathname === item.href || (item.href !== "/admin" && item.href !== "/teacher" && item.href !== "/student" && pathname.startsWith(item.href)));
                        const hasChildren = item.children && item.children.length > 0;
                        const childActive = hasChildren && item.children.some((c: any) => pathname.startsWith(c.href));
                        const isOpen = openMenus[item.label] ?? childActive;

                        if (hasChildren) {
                            return (
                                <div key={item.label} className="space-y-0.5">
                                    <button
                                        onClick={() => setOpenMenus(prev => ({ ...prev, [item.label]: !(prev[item.label] ?? childActive) }))}
                                        className={cn(
                                            "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground group relative",
                                            childActive ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground"
                                        )}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {(!isCollapsed || isMobileOpen) && (
                                            <>
                                                <span className="flex-1 text-left truncate">{item.label}</span>
                                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                                            </>
                                        )}
                                    </button>
                                    {(!isCollapsed || isMobileOpen) && isOpen && (
                                        <div className="ml-2 pl-3 border-l space-y-0.5">
                                            {item.children.map((child: any) => {
                                                const ChildIcon = child.icon;
                                                const isChildActive = pathname.startsWith(child.href);
                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        prefetch={false}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                            isChildActive ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:text-primary-foreground shadow-xs" : "text-muted-foreground"
                                                        )}
                                                    >
                                                        <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{child.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground group relative",
                                    isActive
                                        ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:text-primary-foreground shadow-xs"
                                        : "text-muted-foreground"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {(!isCollapsed || isMobileOpen) && (
                                    <span className="truncate">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer info */}
            {(!isCollapsed || isMobileOpen) && (
                <div className="border-t p-4 text-xs text-muted-foreground bg-muted/30">
                    <p className="font-semibold text-foreground">{roleTitle}</p>
                    <p className="text-[11px]">Super App EdTech System v1.0</p>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sticky Sidebar */}
            <aside
                className={cn(
                    "relative hidden border-r bg-card transition-all duration-300 md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto shrink-0 select-none",
                    isCollapsed ? "w-16" : "w-64"
                )}
            >
                {/* Toggle collapse button */}
                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-foreground shadow-md hover:bg-accent cursor-pointer"
                    aria-label="Toggle Sidebar"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronLeft className="h-3.5 w-3.5" />
                    )}
                </button>

                {sidebarContent}
            </aside>

            {/* Mobile Slide-Over Drawer Sheet */}
            {isMobileOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
                        onClick={onMobileClose}
                        aria-hidden="true"
                    />
                    {/* Drawer Panel */}
                    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r shadow-2xl md:hidden flex flex-col transform transition-transform duration-300 ease-in-out">
                        {sidebarContent}
                    </div>
                </>
            )}
        </>
    );
}
