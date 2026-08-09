"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import { getAdminNav, isNavActive, dashboardHref } from "@/config/admin-nav";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";

export function AdminSidebar() {
    const { user, logout } = useAuthStore();
    const { sidebarCollapsed, toggleSidebar, collapsedGroups, toggleGroup } = useUIStore();
    const router = useRouter();
    const pathname = usePathname();
    const [filter, setFilter] = useState("");

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const groups = user ? getAdminNav(user.role) : [];
    const dash = user ? dashboardHref(user.role) : "/login";

    const renderContent = (collapsed: boolean) => (
        <>
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Brand Header */}
                <div className="h-[72px] flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
                    <Link href={dash} className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading text-xl shrink-0">
                            YL
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="font-heading font-bold text-lg leading-none text-foreground">
                                    YakinLulus<span className="text-primary">.id</span>
                                </span>
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    {user?.role} Platform
                                </span>
                            </div>
                        )}
                    </Link>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 text-muted-foreground shrink-0 hidden md:flex">
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Search + Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
                    {!collapsed && (
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Cari menu…"
                                className="h-9 w-full rounded-xl bg-muted/60 pl-9 pr-3 text-xs font-medium border border-transparent focus:border-input focus:bg-background transition-all outline-none"
                            />
                        </div>
                    )}
                    {groups.map((group) => {
                        const matches = group.items.filter((i) =>
                            i.title.toLowerCase().includes(filter.toLowerCase())
                        );
                        if (filter && matches.length === 0) return null;

                        // Dashboard / group tanpa collapsible semua
                        if (!group.collapsible || (group.items.length === 1 && !filter)) {
                            const item = (filter ? matches : group.items)[0];
                            const ItemIcon = item.icon;
                            const active = isNavActive(item.href, pathname);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.title : undefined}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150",
                                        active
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                        collapsed && "justify-center px-0"
                                    )}
                                >
                                    <ItemIcon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "")} />
                                    {!collapsed && <span>{item.title}</span>}
                                    {item.badge && !collapsed && (
                                        <Badge className="ml-auto text-[9px] bg-amber-100 text-amber-700">{item.badge}</Badge>
                                    )}
                                </Link>
                            );
                        }

                        const nonFiltered = filter ? matches : group.items;
                        if (nonFiltered.length === 0) return null;
                        const GroupIcon = group.icon;

                        return (
                            <Collapsible key={group.title} defaultOpen={!collapsedGroups.includes(group.title)}>
                                <CollapsibleTrigger
                                    onClick={() => toggleGroup(group.title)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                                >
                                    <Button asChild size="icon" variant="ghost" className="h-5 w-5 p-0">
                                        <GroupIcon className="h-5 w-5 shrink-0" />
                                    </Button>
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 text-left">{group.title}</span>
                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform data-[panel-state=open]:-rotate-180" />
                                        </>
                                    )}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-1 pt-1">
                                    {nonFiltered.map((item) => {
                                        const ItemIcon = item.icon;
                                        const active = isNavActive(item.href, pathname);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                title={collapsed ? item.title : undefined}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150",
                                                    active
                                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                                                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                                    collapsed && "justify-center px-0"
                                                )}
                                            >
                                                <ItemIcon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "")} />
                                                {!collapsed && <span>{item.title}</span>}
                                                {item.badge && !collapsed && (
                                                    <Badge className="ml-auto text-[9px] bg-amber-100 text-amber-700">{item.badge}</Badge>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </nav>
            </div>

            {/* Footer Profile & Logout */}
            <div className="p-3 border-t border-sidebar-border">
                {!collapsed ? (
                    <div className="flex items-center justify-between gap-2 px-2 py-1">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <Avatar
                                src={user?.avatar_url}
                                fallback={user?.full_name?.charAt(0) || "U"}
                                size="sm"
                                className="shrink-0"
                            />
                            <div className="flex flex-col truncate">
                                <span className="text-xs font-semibold truncate text-foreground">
                                    {user?.full_name || "Pengguna"}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                    {user?.role || ""}
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
        </>
    );

    return (
        <>
            <aside
                className={cn(
                    "fixed left-0 top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col justify-between hidden md:flex",
                    sidebarCollapsed ? "w-[72px]" : "w-[280px]"
                )}
            >
                {renderContent(sidebarCollapsed)}
            </aside>
            <Sheet>
                <SheetTrigger
                    render={
                        <Button variant="ghost" size="icon" className="md:hidden fixed left-3 top-3 z-40 text-muted-foreground" />
                    }
                >
                    <ChevronRight className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                    <div className="flex flex-col h-full">{renderContent(false)}</div>
                </SheetContent>
            </Sheet>
        </>
    );
}