"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useResults } from "@/lib/api";
import { BarChart3, Download, FileText } from "lucide-react";

export default function StaffReportsPage() {
    const { data: results, isLoading } = useResults();

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                    <p className="text-sm text-muted-foreground">Exam results and performance data</p>
                </div>
                <Badge variant="secondary" className="text-xs">Read-Only</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-xs font-semibold text-muted-foreground">Total Results</span>
                    </div>
                    <p className="text-3xl font-black">{(results as any)?.length ?? 0}</p>
                </Card>
            </div>

            <Card className="p-4">
                <div className="flex items-center justify-between border-b pb-3 mb-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Recent Results
                    </h3>
                </div>
                {(results as any)?.length > 0 ? (
                    <div className="space-y-2">
                        {(results as any).slice(0, 10).map((r: any, i: number) => (
                            <div key={r.id || i} className="flex items-center justify-between p-2 text-xs border-b last:border-0">
                                <span>{r.exam_title || `Result #${i + 1}`}</span>
                                <Badge variant={r.score >= 70 ? "default" : "destructive"} className="text-[10px]">
                                    {r.score ?? "—"}%
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground py-6 text-center">No results available.</p>
                )}
            </Card>
        </div>
    );
}
