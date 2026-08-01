"use client";

import * as React from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { StudentShell } from "@/components/layout/StudentShell";
import { usePathname } from "next/navigation";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    // Determine current portal role context from URL path
    const role: "student" | "teacher" | "staff" | "admin" = pathname.startsWith("/admin")
        ? "admin"
        : pathname.startsWith("/staff")
            ? "staff"
            : pathname.startsWith("/teacher")
                ? "teacher"
                : "student";

    // Student role uses the mobile-first StudentShell; other roles keep the desktop portal shell
    if (role === "student") {
        return (
            <AuthProvider>
                <StudentShell>{children}</StudentShell>
            </AuthProvider>
        );
    }

    const handleToggleMobileNav = () => {
        setIsMobileOpen((prev) => !prev);
    };

    const handleCloseMobileNav = () => {
        setIsMobileOpen(false);
    };

    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
                <Header role={role} onToggleMobileNav={handleToggleMobileNav} />
                <div className="flex-1 flex min-w-0">
                    <Sidebar
                        role={role}
                        isMobileOpen={isMobileOpen}
                        onMobileClose={handleCloseMobileNav}
                    />
                    <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                        {children}
                    </main>
                </div>
                <MobileNav role={role} onOpenFullMenu={handleToggleMobileNav} />
            </div>
        </AuthProvider>
    );
}
