"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Bot, Sparkles, Cpu, Database, Zap, DollarSign, Terminal,
    RotateCcw, SlidersHorizontal, CheckCircle2, MessageSquare, Users,
    Trash2, Search, RefreshCw
} from "lucide-react";
import { useAIStats, useAIConversations, useDeleteAIConversation } from "@/lib/api";

const SYSTEM_PROMPT = `Kamu adalah AI Tutor YakinLulus.id, asisten belajar untuk siswa SMA/SMK Indonesia. Jawab pertanyaan dengan bahasa Indonesia yang mudah dipahami. Berikan penjelasan langkah demi langkah. Gunakan format markdown untuk rumus matematika (LaTeX). Bila ditanya di luar pelajaran sekolah, arahkan kembali ke topik belajar.`;

const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function AITutorAdminPage() {
    const [page, setPage] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const { data: stats, isLoading: statsLoading } = useAIStats() as any;
    const { data: convData, isLoading: convsLoading } = useAIConversations(page) as any;
    const deleteConv = useDeleteAIConversation();

    const conversations = convData?.conversations ?? [];
    const totalConvs = convData?.total ?? 0;
    const totalPages = Math.ceil(totalConvs / 20);

    const filteredConvs = search
        ? conversations.filter((c: any) => c.title?.toLowerCase().includes(search.toLowerCase()))
        : conversations;

    const statCards = [
        {
            label: "Total Percakapan",
            value: stats?.total_conversations ?? 0,
            sub: "Semua waktu",
            icon: MessageSquare,
            color: "text-indigo-500",
        },
        {
            label: "Total Pesan",
            value: stats?.total_messages ?? 0,
            sub: "User + AI responses",
            icon: Zap,
            color: "text-primary",
        },
        {
            label: "Percakapan Hari Ini",
            value: stats?.today_conversations ?? 0,
            sub: "Sejak 00:00 WIB",
            icon: Sparkles,
            color: "text-success",
        },
        {
            label: "Pengguna Aktif",
            value: stats?.active_users ?? 0,
            sub: "Unique users",
            icon: Users,
            color: "text-warning",
        },
    ];

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">LLM ENGINE</Badge>
                        <span className="text-xs text-muted-foreground">Gemini / GPT-4o-mini</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">AI Companion Engine Management</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola prompt sistem AI Tutor 24/7, pantau percakapan pengguna, dan monitoring penggunaan.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs font-semibold" onClick={() => window.location.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Card key={card.label} className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-semibold">{card.label}</span>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                        <div className={`text-2xl font-black ${card.color}`}>
                            {statsLoading ? "..." : card.value.toLocaleString()}
                        </div>
                        <span className="text-[11px] text-muted-foreground">{card.sub}</span>
                    </Card>
                ))}
            </div>

            {/* System Prompt + Conversations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Prompt */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-primary" /> Active System Prompt
                        </h3>
                    </div>
                    <div className="p-4 rounded-xl border bg-muted/40 font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {SYSTEM_PROMPT}
                    </div>
                </Card>

                {/* Quick Info */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Database className="h-4 w-4 text-indigo-500" /> AI Engine Status
                        </h3>
                        <Badge variant="success" className="text-[10px] font-bold">ACTIVE</Badge>
                    </div>
                    <div className="space-y-3 text-xs">
                        {[
                            { name: "Total Percakapan", val: (stats?.total_conversations ?? 0).toLocaleString() },
                            { name: "Total Pesan Terkirim", val: (stats?.total_messages ?? 0).toLocaleString() },
                            { name: "Percakapan Hari Ini", val: (stats?.today_conversations ?? 0).toLocaleString() },
                            { name: "Pengguna Unik", val: (stats?.active_users ?? 0).toLocaleString() },
                        ].map((info, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                                <h4 className="font-bold">{info.name}</h4>
                                <span className="font-mono text-sm font-black text-primary">{info.val}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Conversations List */}
            <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" /> Riwayat Percakapan
                    </h3>
                    <Badge variant="outline" className="text-[10px]">{totalConvs} total</Badge>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari percakapan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>

                {/* Table */}
                {convsLoading ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">Memuat data...</div>
                ) : filteredConvs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                        {search ? "Tidak ada percakapan yang cocok" : "Belum ada percakapan"}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b text-muted-foreground font-semibold">
                                    <th className="text-left py-2 pr-4">Judul</th>
                                    <th className="text-left py-2 pr-4">Pesan</th>
                                    <th className="text-left py-2 pr-4">Terakhir Update</th>
                                    <th className="text-right py-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredConvs.map((conv: any) => (
                                    <tr key={conv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="py-3 pr-4 font-medium max-w-[300px] truncate">
                                            {conv.title || "Percakapan AI"}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <Badge variant="outline" className="text-[10px]">{conv.message_count}</Badge>
                                        </td>
                                        <td className="py-3 pr-4 text-muted-foreground">
                                            {formatDate(conv.updated_at)}
                                        </td>
                                        <td className="py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0"
                                                disabled={deleteConv.isPending}
                                                onClick={() => {
                                                    if (confirm("Hapus percakapan ini?")) {
                                                        deleteConv.mutate(conv.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-[11px] text-muted-foreground">
                            Halaman {page + 1} dari {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
