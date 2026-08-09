"use client";
import Link from "next/link";
import { Users, FileCheck, BookOpen, Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem } from "@/types/admin";

const ICONS: Record<string, typeof Activity> = {
    user: Users,
    exam: FileCheck,
    material: BookOpen,
};

export function AdminRecentActivity({ items, isLoading }: { items?: ActivityItem[]; isLoading: boolean }) {
    if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
    const list = items ?? [];
    return (
        <Card className="p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Aktivitas Terbaru
            </h3>
            {list.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground space-y-3">
                    <p className="text-xs">Belum ada aktivitas terbaru.</p>
                    <Link href="/admin/exams">
                        <Button variant="outline" size="sm" className="rounded-lg">Lihat Ujian</Button>
                    </Link>
                </div>
            ) : (
                <ul className="divide-y divide-border">
                    {list.map((item, i) => {
                        const IconComp = ICONS[item.type] ?? Activity;
                        return (
                            <li key={i} className="flex items-center gap-3 py-2.5">
                                <IconComp className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-xs text-foreground font-medium flex-1">{item.message}</span>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                    {item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : "-"}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}