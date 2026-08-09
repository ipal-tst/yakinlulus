"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Menu, Search, Sun, Moon, Bell, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { getAdminNav, findActiveNav, dashboardHref } from "@/config/admin-nav";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminTopbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const { toggleSidebar } = useUIStore();
    const [mounted, setMounted] = useState(false);
    const [unreadNotifications] = useState(0);
    const [, setCommandOpen] = useState(false);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setMounted(true), []);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const groups = user ? getAdminNav(user.role) : [];
    const active = findActiveNav(groups, pathname);

    return (
        <header className="sticky top-0 z-20 h-[72px] bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden text-muted-foreground" title="Menu">
                    <Menu className="h-5 w-5" />
                </Button>

                <button type="button" onClick={() => setCommandOpen(true)}
                    className="relative hidden sm:flex items-center w-64 md:w-80 h-10 rounded-xl bg-muted/60 pl-9 pr-4 text-xs font-medium text-muted-foreground border border-transparent hover:border-input transition-all cursor-text text-left">
                    <Search className="absolute left-3 h-4 w-4" />
                    <span>Cari halaman admin…  <kbd className="ml-2 rounded bg-background border border-border px-1.5 text-[10px]">Ctrl K</kbd></span>
                </button>

                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={dashboardHref(user?.role || "SISWA")}>Beranda</BreadcrumbLink>
                        </BreadcrumbItem>
                        {active?.group && active.group.title !== "Dashboard" && (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href={active.item.href}>{active.group.title}</BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        )}
                        {active?.item && active.item.title !== "Beranda" && (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbPage>{active.item.title}</BreadcrumbPage>
                            </>
                        )}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
                {mounted && (
                    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-xl text-muted-foreground hover:text-foreground" title="Ganti Tema">
                        {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
                    </Button>
                )}

                <Link href="/staff/notifications">
                    <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground" title="Notifikasi">
                        <Bell className="h-5 w-5" />
                        {unreadNotifications > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </span>
                        )}
                    </Button>
                </Link>

                <div className="flex items-center gap-3 pl-2 border-l border-border">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 group outline-none">
                            <Avatar src={user?.avatar_url} fallback={user?.full_name?.charAt(0) || "U"} size="sm" />
                            <div className="hidden lg:flex flex-col text-left">
                                <span className="text-xs font-semibold group-hover:text-primary transition-colors text-foreground">{user?.full_name || "Pengguna"}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{user?.role}</span>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                                    <UserIcon className="h-4 w-4" /> <span>Akun</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                                    <Settings className="h-4 w-4" /> <span>Pengaturan</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} variant="destructive">
                                <LogOut className="h-4 w-4" /> <span>Keluar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}