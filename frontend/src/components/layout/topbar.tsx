"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sun,
    Moon,
    Bell,
    Search,
    Menu,
    User as UserIcon,
    LogOut,
    Settings,
} from "lucide-react";
import { useState, useEffect } from "react";

export function Topbar() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const { toggleSidebar } = useUIStore();
    const [mounted, setMounted] = useState(false);
    const [unreadNotifications] = useState(3); // Mock count

    useEffect(() => setMounted(true), []);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-20 h-[72px] bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 flex items-center justify-between">
            {/* Mobile Menu Toggle & Title */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="md:hidden text-muted-foreground"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Global Search Bar */}
                <div className="relative hidden sm:flex items-center w-64 md:w-80">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari materi, latihan, atau soal... (Ctrl+K)"
                        className="h-10 w-full rounded-xl bg-muted/60 pl-9 pr-4 text-xs font-medium border border-transparent focus:border-input focus:bg-background transition-all outline-none"
                    />
                </div>
            </div>

            {/* Right Action Items */}
            <div className="flex items-center gap-2">
                {/* Dark Mode Toggle */}
                {mounted && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-xl text-muted-foreground hover:text-foreground"
                        title="Ganti Tema"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-5 w-5 text-amber-400" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </Button>
                )}

                {/* Notifications Bell */}
                <Link href="/notifications">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative rounded-xl text-muted-foreground hover:text-foreground"
                        title="Notifikasi"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadNotifications > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </Button>
                </Link>

                {/* User Profile Dropdown */}
                <div className="flex items-center gap-3 pl-2 border-l border-border">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 group outline-none">
                            <Avatar
                                src={user?.avatar_url}
                                fallback={user?.full_name?.charAt(0) || "U"}
                                size="sm"
                            />
                            <div className="hidden lg:flex flex-col text-left">
                                <span className="text-xs font-semibold group-hover:text-primary transition-colors text-foreground">
                                    {user?.full_name || "Pengguna"}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                    {user?.role || "SISWA"}
                                </span>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => router.push("/profile")}>
                                    <UserIcon className="h-4 w-4" />
                                    <span>Profil</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/settings")}>
                                    <Settings className="h-4 w-4" />
                                    <span>Pengaturan</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} variant="destructive">
                                <LogOut className="h-4 w-4" />
                                <span>Keluar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
