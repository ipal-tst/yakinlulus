"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { academicService } from "@/services/academic.service";
import { RankingItem } from "@/types";
import { Trophy, Award, Medal, Crown } from "lucide-react";

export default function RankingPage() {
    const [rankings, setRankings] = useState<RankingItem[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getRankings();
                setRankings(res);
            } catch {
                setRankings([
                    { rank: 1, user_name: "Muhammad Rizky", school_name: "SMA Negeri 8 Jakarta", score: 795, avatar_url: "" },
                    { rank: 2, user_name: "Amanda Putri", school_name: "SMA Negeri 3 Bandung", score: 785, avatar_url: "" },
                    { rank: 3, user_name: "Kevin Pratama", school_name: "SMA Negeri 1 Yogyakarta", score: 770, avatar_url: "" },
                    { rank: 4, user_name: "Budi Santoso", school_name: "SMA Negeri 1 Surabaya", score: 755, avatar_url: "" },
                    { rank: 5, user_name: "Siti Rahma", school_name: "SMA Negeri 2 Semarang", score: 740, avatar_url: "" },
                ]);
            }
        }
        load();
    }, []);

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Leaderboard & Peringkat Nasional</h1>
                    <p className="text-sm text-muted-foreground">Peringkat skor UTBK tertinggi seluruh siswa YakinLulus.id di Indonesia.</p>
                </div>

                {/* Top 3 Podium Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    {rankings.slice(0, 3).map((r, idx) => (
                        <Card key={r.rank} className="p-6 flex flex-col items-center text-center space-y-3 relative overflow-hidden border-primary/20">
                            <div className="absolute top-3 right-3 text-amber-500 font-bold flex items-center gap-1">
                                {idx === 0 ? <Crown className="h-6 w-6 text-amber-400 fill-amber-400" /> : <Medal className="h-5 w-5" />}
                            </div>
                            <Avatar fallback={r.user_name.charAt(0)} size="lg" className="border-2 border-primary" />
                            <div>
                                <h3 className="font-heading font-bold text-base">{r.user_name}</h3>
                                <p className="text-xs text-muted-foreground">{r.school_name}</p>
                            </div>
                            <div className="pt-2">
                                <span className="font-heading font-extrabold text-2xl text-primary">{r.score}</span>
                                <span className="block text-[10px] text-muted-foreground">Skor UTBK</span>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Full Ranking List */}
                <Card className="p-4 divide-y divide-border">
                    {rankings.map((r) => (
                        <div key={r.rank} className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors rounded-xl">
                            <div className="flex items-center gap-4">
                                <span className="font-heading font-bold text-sm text-muted-foreground w-6 text-center">
                                    #{r.rank}
                                </span>
                                <Avatar fallback={r.user_name.charAt(0)} size="sm" />
                                <div>
                                    <h4 className="font-heading font-semibold text-sm">{r.user_name}</h4>
                                    <p className="text-xs text-muted-foreground">{r.school_name}</p>
                                </div>
                            </div>
                            <span className="font-heading font-bold text-base text-primary">{r.score}</span>
                        </div>
                    ))}
                </Card>
            </div>
        </AppShell>
    );
}
