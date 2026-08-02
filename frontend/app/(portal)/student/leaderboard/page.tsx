"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLeaderboard, useXP, useBadges, useUserBadges } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Crown, Medal, Award, Star, Sparkles, Lock } from "lucide-react";

interface LeaderboardRow {
    rank: number;
    user_id: string;
    full_name: string;
    total_xp: number;
    level: number;
}

interface BadgeItem {
    code: string;
    name: string;
    icon_url?: string | null;
    category?: string;
}

const MOCK_LEADERBOARD: LeaderboardRow[] = [
    { rank: 1, user_id: "mock-1", full_name: "Ahmad Fauzi", total_xp: 4850, level: 5 },
    { rank: 2, user_id: "mock-2", full_name: "Siti Rahma", total_xp: 4210, level: 5 },
    { rank: 3, user_id: "mock-3", full_name: "Budi Santoso", total_xp: 2850, level: 3 },
    { rank: 4, user_id: "mock-4", full_name: "Dewi Lestari", total_xp: 2410, level: 3 },
    { rank: 5, user_id: "mock-5", full_name: "Rizky Pratama", total_xp: 1980, level: 2 },
];

const PERIOD_TABS: { value: "week" | "all"; label: string }[] = [
    { value: "week", label: "Mingguan" },
    { value: "all", label: "Sepanjang Waktu" },
];

const BADGE_ICONS = [Crown, Trophy, Medal, Award, Star];

export default function StudentLeaderboardPage() {
    const [period, setPeriod] = React.useState<"week" | "all">("all");
    const { user } = useAuth();
    const { data: leaderboardData } = useLeaderboard(20, period);
    useXP();
    const { data: badgesData } = useBadges();
    const { data: userBadgesData } = useUserBadges();

    const rows: LeaderboardRow[] =
        Array.isArray(leaderboardData) && leaderboardData.length > 0
            ? (leaderboardData as LeaderboardRow[])
            : MOCK_LEADERBOARD;

    const badges = (Array.isArray(badgesData) ? badgesData : []) as BadgeItem[];
    const earnedCodes = new Set(
        (Array.isArray(userBadgesData) ? userBadgesData : []).map((b: any) => b.code),
    );

    const currentUserRow = rows.find((u) => u.user_id === user?.id);
    const hero: LeaderboardRow =
        currentUserRow ?? rows[0] ?? { rank: 1, user_id: "", full_name: "—", total_xp: 0, level: 1 };
    const heroXp = Number(hero.total_xp) || 0;
    const heroLevel = Number(hero.level) || 1;
    const heroRank = Number(hero.rank) || 1;
    const levelProgress = Math.max(
        0,
        Math.min(((heroXp - (heroLevel - 1) * 1000) / 1000) * 100, 100),
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Papan Peringkat</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kompetisi sehat se-Indonesia. Kumpulkan XP dari Latihan & Tryout untuk naik level!
                    </p>
                </div>
                <div className="flex gap-2">
                    {PERIOD_TABS.map((tab) => (
                        <Button
                            key={tab.value}
                            type="button"
                            variant={period === tab.value ? "default" : "outline"}
                            size="sm"
                            className="rounded-full px-4 text-xs font-bold"
                            onClick={() => setPeriod(tab.value)}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Hero peringkat */}
            <section className="bg-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-lg shadow-primary/20">
                <Trophy className="absolute -right-6 -top-6 h-32 w-32 opacity-10 pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">
                                {currentUserRow ? "Peringkatmu" : "Peringkat Teratas"}
                            </span>
                            <div className="flex items-end gap-2 mt-1">
                            <span className="text-4xl font-black leading-none">{heroRank}</span>
                            <span className="text-sm font-bold pb-0.5 opacity-80">/ {rows.length}</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-2xl font-extrabold">{heroXp.toLocaleString()} XP</div>
                        <div className="text-xs font-semibold opacity-80">Level {heroLevel}</div>
                    </div>
                    </div>
                    <div className="mt-5">
                        <div className="h-2 bg-on-primary/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${levelProgress}%` }}
                            />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[11px] opacity-80">
                            <span className="font-semibold truncate">{hero.full_name}</span>
                            <span>{Math.round(levelProgress)}% ke Level {heroLevel + 1}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Badges horizontal scroll */}
            {badges.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold flex items-center gap-1.5 mb-3">
                        <Sparkles className="h-4 w-4 text-primary" /> Lencana
                    </h2>
                    <div className="flex overflow-x-auto gap-3 no-scrollbar">
                        {badges.map((badge, i) => {
                            const earned = earnedCodes.has(badge.code);
                            const Icon = BADGE_ICONS[i % BADGE_ICONS.length]!;
                            return (
                                <div key={badge.code} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                                    <div
                                        className={`w-16 h-16 rounded-full flex items-center justify-center ${earned
                                            ? i % 2 === 0
                                                ? "bg-tertiary-container text-on-tertiary-container"
                                                : "bg-secondary-container text-on-secondary-container"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {earned ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
                                    </div>
                                    <span className="text-[10px] text-center font-semibold leading-tight text-muted-foreground line-clamp-2">
                                        {badge.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Daftar peringkat */}
            <section className="bg-card rounded-2xl border border-border shadow-sm p-5">
                <h2 className="font-bold text-sm mb-2">Peringkat {period === "week" ? "Minggu Ini" : "Sepanjang Waktu"}</h2>
                <div>
                    {rows.map((u) => {
                        const isMe = u.user_id === user?.id;
                        return (
                            <div
                                key={u.user_id}
                                className={`flex items-center justify-between py-3 border-b last:border-0 ${isMe ? "bg-primary/5 border-l-4 border-primary" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span
                                        className={`w-8 text-center font-black ${u.rank === 1
                                            ? "text-warning"
                                            : u.rank === 2
                                                ? "text-muted-foreground"
                                                : u.rank === 3
                                                    ? "text-amber-600"
                                                    : "text-foreground"
                                            }`}
                                    >
                                        {Number(u.rank) || "—"}
                                    </span>
                                    <div className="min-w-0">
                                        <span className="font-bold text-sm block truncate">
                                            {u.full_name}
                                            {isMe && <span className="text-primary ml-1">(Anda)</span>}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">Level {Number(u.level) || 1}</span>
                                    </div>
                                </div>
                                <div className="shrink-0 text-xs font-mono font-bold">
                                    {(Number(u.total_xp) || 0).toLocaleString()} XP
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
