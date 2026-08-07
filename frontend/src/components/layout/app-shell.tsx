"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

interface AppShellProps {
    children: React.ReactNode;
    showSidebar?: boolean;
    showTopbar?: boolean;
}

export function AppShell({
    children,
    showSidebar = true,
    showTopbar = true,
}: AppShellProps) {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {showSidebar && <Sidebar />}

            <div
                className={cn(
                    "flex-1 flex flex-col transition-all duration-300",
                    showSidebar && (sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[280px]")
                )}
            >
                {showTopbar && <Topbar />}

                <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-[1440px] mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
