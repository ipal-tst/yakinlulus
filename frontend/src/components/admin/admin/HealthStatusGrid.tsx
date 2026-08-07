// src/components/admin/admin/HealthStatusGrid.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminHealth } from "@/types/admin";
import { Activity, Cpu, Database, HardDrive, Server } from "lucide-react";

export function HealthStatusGrid({ health }: { health: AdminHealth }) {
    const services = health.services || [
        { name: "PostgreSQL Database", endpoint: "db.supabase.co", status: "healthy", latency: "12ms", uptime: "99.9%" },
        { name: "Fiber Go Web Server", endpoint: "localhost:8080", status: "healthy", latency: "2ms", uptime: "100%" },
        { name: "MinIO / S3 Storage", endpoint: "supabase.co/storage", status: "healthy", latency: "45ms", uptime: "99.8%" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((s, i) => (
                <Card key={i} className="p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h4 className="font-heading font-bold text-base text-foreground">{s.name}</h4>
                            {s.endpoint && <p className="text-xs font-mono text-muted-foreground">{s.endpoint}</p>}
                        </div>
                        <Badge variant={s.status === "healthy" ? "success" : "destructive"}>{s.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 mt-2 border-t border-border/50">
                        <span>Latensi: <strong className="text-foreground">{s.latency}</strong></span>
                        <span>Uptime: <strong className="text-foreground">{s.uptime}</strong></span>
                    </div>
                </Card>
            ))}
        </div>
    );
}