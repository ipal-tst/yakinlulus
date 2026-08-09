"use client";
import { Badge } from "@/components/ui/badge";
import { mapExamStatus } from "@/lib/dashboard-mappers";
import type { CBTMonitoring } from "@/types/admin";

const VARIANT = { Draft: "outline", Published: "success", Archived: "secondary" } as const;

export function AdminExamStatus({ monitor }: { monitor?: CBTMonitoring }) {
    const items = mapExamStatus(monitor);
    return (
        <div className="space-y-3">
            {items.map((it) => (
                <div key={it.label} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <span className="text-sm font-medium">{it.label}</span>
                    <Badge variant={VARIANT[it.label]}>{it.value}</Badge>
                </div>
            ))}
        </div>
    );
}