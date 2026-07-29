"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStaffDashboard } from "@/lib/api";
import {
    LayoutDashboard,
    FileSpreadsheet,
    BarChart3,
    Database,
    Users,
    Activity,
    Clock,
} from "lucide-react";

export default function StaffDashboardPage() {
    const { data: dashboard, isLoading } = useStaffDashboard();
    const d = (dashboard as any) || {};

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Operational overview & monitoring</p>
                </div>
                <Badge variant="secondary" className="text-xs">Staff Portal</Badge>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 skeleton" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Activity className="h-5 w-5" />
                            <span className="text-xs font-semibold text-muted-foreground">Active Sessions</span>
                        </div>
                        <p className="text-3xl font-black">{d.active_sessions ?? 0}</p>
                    </Card>
                    <Card className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-secondary">
                            <FileSpreadsheet className="h-5 w-5" />
                            <span className="text-xs font-semibold text-muted-foreground">Exams In Progress</span>
                        </div>
                        <p className="text-3xl font-black">{d.exams_in_progress ?? 0}</p>
                    </Card>
                    <Card className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-tertiary">
                            <Clock className="h-5 w-5" />
                            <span className="text-xs font-semibold text-muted-foreground">Pending Reviews</span>
                        </div>
                        <p className="text-3xl font-black">{d.pending_reviews ?? 0}</p>
                    </Card>
                    <Card className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <BarChart3 className="h-5 w-5" />
                            <span className="text-xs font-semibold text-muted-foreground">Reports Today</span>
                        </div>
                        <p className="text-3xl font-black">{d.reports_generated_today ?? 0}</p>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" /> Recent Activities
                    </h3>
                    <div className="space-y-3">
                        {(d.recent_activities || []).length > 0 ? (
                            d.recent_activities.slice(0, 5).map((act: any) => (
                                <div key={act.id} className="flex items-center justify-between text-xs border-b pb-2 last:border-0">
                                    <span>{act.description}</span>
                                    <span className="text-muted-foreground">{act.timestamp}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground py-4 text-center">No recent activities</p>
                        )}
                    </div>
                </Card>
                <Card className="p-5">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" /> Academic Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Total Levels", key: "total_levels" },
                            { label: "Total Subjects", key: "total_subjects" },
                            { label: "Total Chapters", key: "total_chapters" },
                            { label: "Total Topics", key: "total_topics" },
                        ].map((stat) => (
                            <div key={stat.key} className="p-3 rounded-lg bg-surface-container-low">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className="text-lg font-bold">
                                    {(d.academic_stats as any)?.[stat.key] ?? d[stat.key] ?? 0}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
