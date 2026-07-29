"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/config/app";
import { Sun, Moon, Bell, User, LogOut, Menu } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
    role?: "student" | "teacher" | "staff" | "admin";
    onToggleSidebar?: () => void;
    onToggleMobileNav?: () => void;
}

export function Header({ role = "student", onToggleMobileNav }: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "admin":
                return "destructive";
            case "teacher":
                return "warning";
            case "staff":
                return "secondary";
            default:
                return "default";
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
            {/* Left: Brand & Mobile Menu Trigger */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleMobileNav}
                    className="md:hidden flex items-center justify-center text-foreground hover:bg-accent cursor-pointer shrink-0"
                    aria-label="Buka Menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shadow-sm">
                        YL
                    </div>
                    <span className="font-bold tracking-tight text-lg hidden sm:inline-block">
                        {APP_CONFIG.name}
                    </span>
                </Link>
                <Badge variant={getRoleBadgeVariant(role)} className="capitalize text-xs">
                    {role} Portal
                </Badge>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="ghost" size="icon" aria-label="Notifikasi">
                    <Bell className="h-4 w-4" />
                </Button>

                {mounted && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-4 w-4 text-warning" />
                        ) : (
                            <Moon className="h-4 w-4 text-primary" />
                        )}
                    </Button>
                )}

                <div className="h-4 w-px bg-border hidden sm:block" />

                {/* Profile Avatar Demo */}
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold text-xs border">
                        <User className="h-4 w-4" />
                    </div>
                    <Link href="/login">
                        <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1 text-xs">
                            <LogOut className="h-3.5 w-3.5" /> Keluar
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
