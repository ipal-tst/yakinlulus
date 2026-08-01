"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import {
    Home,
    BookOpen,
    FileSpreadsheet,
    User,
    Bell,
    HelpCircle,
    Trophy,
    Bot,
    BarChart3,
    ChevronLeft,
} from "lucide-react";

interface StudentShellProps {
    children: React.ReactNode;
}

const NAV_ITEMS = [
    { label: "Home", href: "/student", icon: Home },
    { label: "Materi", href: "/student/materials", icon: BookOpen },
    { label: "Ujian", href: "/student/exam", icon: FileSpreadsheet },
    { label: "Profil", href: "/student/profile", icon: User },
];

const TITLE_MAP: [string, string][] = [
    ["/student/materials/", "Materi"],
    ["/student/materials", "Materi Belajar"],
    ["/student/practice", "Latihan Soal"],
    ["/student/exam", "Ujian & Tryout"],
    ["/student/ai-tutor", "AI Tutor"],
    ["/student/analytics", "Progress & Analytics"],
    ["/student/leaderboard", "Leaderboard & XP"],
    ["/student/profile", "Profil"],
    ["/student", "Home"],
];

function getPageTitle(pathname: string): string {
    const match = TITLE_MAP.find(([prefix]) => pathname.startsWith(prefix));
    return match ? match[1] : "YakinLulus";
}

export function StudentShell({ children }: StudentShellProps) {
    const pathname = usePathname();
    const title = getPageTitle(pathname);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Top Header (desktop + mobile) */}
            <header className="sticky top-0 z-40 h-16 bg-card/85 backdrop-blur-xl border-b border-border">
                <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-full max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 min-w-0">
                        {!pathname.startsWith("/student/materials/") && pathname !== "/student" && (
                            <button
                                onClick={() => window.history.back()}
                                className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted cursor-pointer"
                                aria-label="Kembali"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}
                        <Link href="/student" className="flex items-center gap-2 shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-sm">
                                YL
                            </div>
                            <span className="hidden sm:inline-block font-bold tracking-tight">
                                YakinLulus.id
                            </span>
                        </Link>
                        <span className="font-semibold text-sm text-foreground truncate">{title}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            aria-label="Notifikasi"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
                        </button>
                        <Link
                            href="/student/profile"
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 cursor-pointer"
                        >
                            <User className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Desktop: Sidebar + content (mobile: bottom nav) */}
            <div className="flex min-w-0">
                {/* Desktop Sidebar — hidden on mobile */}
                <div className="hidden md:block shrink-0">
                    <Sidebar role="student" />
                </div>

                {/* Main Content */}
                <main className="flex-1 min-w-0 pt-0 pb-24 md:pb-10 max-w-7xl mx-auto w-full px-4 md:px-8 overflow-x-hidden">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden h-16 bg-card/90 backdrop-blur-xl border-t border-border pb-safe">
                <div className="flex items-center justify-around h-full px-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors py-1 px-3 flex-1 text-center",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="truncate max-w-[64px]">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
