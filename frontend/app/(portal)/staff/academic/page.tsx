"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLevels, useSubjects } from "@/lib/api";
import { Database, BookOpen, Layers } from "lucide-react";

export default function StaffAcademicPage() {
    const { data: levels, isLoading: levelsLoading } = useLevels();
    const { data: subjects, isLoading: subjectsLoading } = useSubjects();

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Academic Data</h1>
                    <p className="text-sm text-muted-foreground">View academic structure</p>
                </div>
                <Badge variant="secondary" className="text-xs">Read-Only</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" /> Levels
                    </h3>
                    {levelsLoading ? (
                        <div className="h-20 skeleton" />
                    ) : (levels as any)?.length > 0 ? (
                        <div className="space-y-1">
                            {(levels as any).map((l: any) => (
                                <div key={l.id} className="p-2 rounded-lg bg-surface-container-low text-xs flex justify-between">
                                    <span className="font-medium">{l.name}</span>
                                    <span className="text-muted-foreground">{l.code || l.id}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground py-4 text-center">No levels data</p>
                    )}
                </Card>

                <Card className="p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" /> Subjects
                    </h3>
                    {subjectsLoading ? (
                        <div className="h-20 skeleton" />
                    ) : (subjects as any)?.length > 0 ? (
                        <div className="space-y-1">
                            {(subjects as any).map((s: any) => (
                                <div key={s.id} className="p-2 rounded-lg bg-surface-container-low text-xs flex justify-between">
                                    <span className="font-medium">{s.name}</span>
                                    <span className="text-muted-foreground">{s.code || s.id}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground py-4 text-center">No subjects data</p>
                    )}
                </Card>
            </div>
        </div>
    );
}
