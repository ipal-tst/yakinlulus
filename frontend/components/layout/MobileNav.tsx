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
    Menu,
    Database,
    Users,
    Settings,
    Bot,
} from "lucide-react";

interface MobileNavProps {
    role?: "student" | "teacher" | "staff" | "admin";
    onOpenFullMenu?: () => void;
}

export function MobileNav({ role = "student", onOpenFullMenu }: MobileNavProps) {
    const pathname = usePathname();

    const studentItems = [
        { label: "Home", href: "/student", icon: LayoutDashboard },
        { label: "Materi", href: "/student/materials", icon: BookOpen },
        { label: "Latihan", href: "/student/practice", icon: HelpCircle },
        { label: "CBT", href: "/student/exam", icon: FileSpreadsheet },
    ];

    const teacherItems = [
        { label: "Command", href: "/teacher", icon: LayoutDashboard },
        { label: "Bank Soal", href: "/teacher/question-bank", icon: HelpCircle },
        { label: "Paket Ujian", href: "/teacher/exam-packages", icon: FileSpreadsheet },
        { label: "Materi", href: "/teacher/materials", icon: BookOpen },
    ];

    const adminItems = [
        { label: "Command", href: "/admin", icon: LayoutDashboard },
        { label: "Master Data", href: "/admin/master-data", icon: Database },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "CBT Ops", href: "/admin/cbt", icon: FileSpreadsheet },
    ];

    const items =
        role === "admin"
            ? adminItems
            : role === "teacher"
                ? teacherItems
                : studentItems;

    return (
        <nav className="fixed bottom-0 left-0 z-30 flex h-16 w-full items-center justify-around border-t bg-background/95 backdrop-blur-md md:hidden px-1">
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 px-2 rounded-md flex-1 text-center",
                            isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="truncate max-w-[64px]">{item.label}</span>
                    </Link>
                );
            })}

            {/* Menu Trigger for Slide-Over Sheet */}
            <button
                onClick={onOpenFullMenu}
                className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 px-2 rounded-md flex-1 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Semua Menu"
            >
                <Menu className="h-5 w-5" />
                <span>Menu</span>
            </button>
        </nav>
    );
}
