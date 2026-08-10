// src/components/admin/admin/HealthStatusGrid.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminHealth } from "@/types/admin";
import { Activity, Cpu, Database, HardDrive, Server } from "lucide-react";

const SPEC_ICONS = [
    { label: "database", icon: Database },
    { label: "server", icon: Server },
    { label: "api", icon: Cpu },
    { label: "storage", icon: HardDrive },
];

export function HealthStatusGrid({ health }: { health: AdminHealth }) {
    const services = health.services || [];

    if (services.length === 0) {
        return (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">Belum Ada Data Layanan</p>
                <p className="text-xs text-muted-foreground">
                    Status layanan backend belum tersedia. Muat ulang halaman untuk mencoba lagi.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((s, i) => {
                const SpecIcon = SPEC_ICONS[i % SPEC_ICONS.length].icon;
                return (
                    <Card key={i} className="p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <SpecIcon className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="font-heading font-bold text-base text-foreground">{s.name}</h4>
                                </div>
                                {s.endpoint && <p className="text-xs font-mono text-muted-foreground">{s.endpoint}</p>}
                            </div>
                            <Badge variant={s.status === "healthy" ? "success" : "destructive"}>{s.status}</Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 mt-2 border-t border-border/50">
                            <span>Latensi: <strong className="text-foreground">{s.latency}</strong></span>
                            <span>Uptime: <strong className="text-foreground">{s.uptime}</strong></span>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}