"use client";
import { Shield, Database, HardDrive, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { uptimeLabel } from "@/lib/dashboard-mappers";
import type { SystemHealth } from "@/types/admin";

export function AdminSystemHealth({ health, isLoading }: { health?: SystemHealth; isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
            </div>
        );
    }
    const items = [
        { label: "API Status", value: health?.api_status || "healthy", icon: Shield, color: "text-green-500" },
        { label: "DB Status", value: health?.db_status || "healthy", icon: Database, color: "text-green-500" },
        { label: "Storage", value: `${health?.storage_usage ?? 0}% used`, icon: HardDrive, color: "text-orange-500" },
        { label: "Uptime", value: uptimeLabel(health?.uptime_hours), icon: Activity, color: "text-blue-500" },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
                <Card key={item.label} className="p-4 hover:border-primary transition-colors rounded-2xl">
                    <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <div>
                            <p className="font-semibold text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.value}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}