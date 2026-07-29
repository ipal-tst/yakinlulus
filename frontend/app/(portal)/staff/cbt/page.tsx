"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExams } from "@/lib/api";
import { FileSpreadsheet, Eye, AlertTriangle } from "lucide-react";

export default function StaffCBTMonitoringPage() {
    const { data: exams, isLoading } = useExams({ status: "PUBLISHED" });

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">CBT Monitoring</h1>
                    <p className="text-sm text-muted-foreground">Monitor active exam sessions</p>
                </div>
                <Badge variant="secondary" className="text-xs">Read-Only</Badge>
            </div>

            <Card className="p-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 skeleton" />
                        ))}
                    </div>
                ) : (exams as any)?.length > 0 ? (
                    <div className="space-y-2">
                        {(exams as any).map((ex: any) => (
                            <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-bold text-sm">{ex.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {ex.total_questions} questions · {ex.duration_minutes} min
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">{ex.status}</Badge>
                                    <Button variant="outline" size="sm" className="text-xs">
                                        <Eye className="h-3.5 w-3.5 mr-1" /> Monitor
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No active exams found.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
