"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Trophy,
    Flame,
    Award,
    Sparkles,
    Medal,
    Crown,
    Star,
    Users,
    Globe
} from "lucide-react";
import { useLeaderboard, useXP, useBadges } from "@/lib/api";

export default function StudentLeaderboardPage() {
    const [scope, setScope] = React.useState<"NASIONAL" | "KOTA" | "SEKOLAH">("NASIONAL");
    const { data: leaderboardData } = useLeaderboard();
    useXP();
    useBadges();

    const MOCK_LEADERBOARD = (leaderboardData as any) ?? [];

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">GAMIFICATION HUB</Badge>
                        <span className="text-xs text-muted-foreground">Go Backend: `internal/gamification`</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Leaderboard & Badges</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kompetisi sehat antar siswa se-Indonesia. Kumpulkan XP dari Latihan dan Tryout untuk naik level!
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {(["NASIONAL", "KOTA", "SEKOLAH"] as const).map((s) => (
                        <Button
                            key={s}
                            variant={scope === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => setScope(s)}
                            className="text-xs font-semibold"
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                {/* Rank 2 */}
                <Card className="p-5 text-center border-slate-300 bg-slate-500/5 space-y-3 order-2 sm:order-1">
                    <div className="h-12 w-12 rounded-full bg-slate-300 text-slate-800 font-bold mx-auto flex items-center justify-center text-lg shadow-md">
                        <Medal className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-mono">Rank #2</span>
                        <h3 className="font-extrabold text-sm">{MOCK_LEADERBOARD[1]?.name ?? "Siti Rahma"}</h3>
                        <p className="text-[11px] text-muted-foreground">{MOCK_LEADERBOARD[1]?.school ?? "SMAN 3 Bandung"}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">{MOCK_LEADERBOARD[1]?.xp ?? 4210} XP</Badge>
                </Card>

                {/* Rank 1 (Gold) */}
                <Card className="p-6 text-center border-warning bg-warning/10 space-y-3 order-1 sm:order-2 shadow-lg">
                    <div className="h-16 w-16 rounded-full bg-warning text-warning-foreground font-bold mx-auto flex items-center justify-center text-xl shadow-xl shadow-warning/30">
                        <Crown className="h-8 w-8 animate-bounce" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-warning font-mono">CHAMPION #1</span>
                        <h3 className="font-black text-base">{MOCK_LEADERBOARD[0]?.name ?? "Ahmad Fauzi"}</h3>
                        <p className="text-xs text-muted-foreground">{MOCK_LEADERBOARD[0]?.school ?? "SMAN 8 Jakarta"}</p>
                    </div>
                    <Badge variant="warning" className="text-xs font-black">{MOCK_LEADERBOARD[0]?.xp ?? 4850} XP</Badge>
                </Card>

                {/* Rank 3 */}
                <Card className="p-5 text-center border-amber-600 bg-amber-600/5 space-y-3 order-3">
                    <div className="h-12 w-12 rounded-full bg-amber-600 text-white font-bold mx-auto flex items-center justify-center text-lg shadow-md">
                        <Award className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-mono">Rank #3 (Anda)</span>
                        <h3 className="font-extrabold text-sm">{MOCK_LEADERBOARD[2]?.name ?? "Budi Santoso"}</h3>
                        <p className="text-[11px] text-muted-foreground">{MOCK_LEADERBOARD[2]?.school ?? "SMAN 1 Surabaya"}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">{MOCK_LEADERBOARD[2]?.xp ?? 2850} XP</Badge>
                </Card>
            </div>

            {/* Leaderboard Table List */}
            <Card className="p-6 space-y-4">
                <h3 className="font-bold text-sm border-b pb-2">Peringkat 5 Besar {scope}</h3>
                <div className="space-y-2">
                    {MOCK_LEADERBOARD.map((u: any) => (
                        <div
                            key={u.rank}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${u.isCurrentUser ? "border-primary bg-primary/10 font-bold" : "bg-card"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-6 text-center font-black text-sm">#{u.rank}</span>
                                <div>
                                    <span className="font-bold text-foreground block">{u.name} {u.isCurrentUser && "(Anda)"}</span>
                                    <span className="text-[10px] text-muted-foreground">{u.school}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 text-warning">
                                    <Flame className="h-3.5 w-3.5" /> {u.streak}d
                                </span>
                                <Badge variant="outline" className="font-bold text-[10px]">{u.xp} XP</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
