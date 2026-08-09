"use client";

import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: ReactNode }) {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <AdminSidebar />
            <div
                className={cn(
                    "flex-1 flex flex-col transition-all duration-300",
                    sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[280px]"
                )}
            >
                <AdminTopbar />
                <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-[1440px] mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}