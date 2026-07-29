"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Eye, Shield } from "lucide-react";

interface Violation {
    type: string;
    timestamp: string;
    count: number;
    details?: string;
}

interface CBTViolationBannerProps {
    violations: Violation[];
    onAcknowledge?: (type: string) => void;
    dismissedTypes?: string[];
}

export function CBTViolationBanner({
    violations,
    onAcknowledge,
    dismissedTypes = [],
}: CBTViolationBannerProps) {
    if (!violations || violations.length === 0) return null;

    const activeViolations = violations.filter(
        (v) => !dismissedTypes?.includes(v.type)
    );

    if (activeViolations.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-md animate-slide-up">
            {activeViolations.map((v) => (
                <Card
                    key={v.type}
                    className="bg-destructive/10 border-destructive/30 shadow-lg p-4"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-destructive">
                                    Pelanggaran Terdeteksi
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {getViolationLabel(v.type)}
                                </p>
                                {v.count > 1 && (
                                    <p className="text-xs text-destructive/80 mt-0.5">
                                        Terjadi {v.count}x · Terakhir {formatTime(v.timestamp)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {onAcknowledge && (
                                <button
                                    onClick={() => onAcknowledge(v.type)}
                                    className="text-xs text-destructive hover:underline font-medium"
                                >
                                    Setuju
                                </button>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function getViolationLabel(type: string): string {
    switch (type) {
        case "TAB_SWITCH":
            return "Berpindah tab/jendela";
        case "WINDOW_BLUR":
            return "Jendela tidak fokus";
        case "FULLSCREEN_EXIT":
            return "Keluar mode fullscreen";
        case "COPY_PASTE":
            return "Menyalin/menempel";
        case "DEVTOOLS":
            return "DevTools dibuka";
        default:
            return type;
    }
}

function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

// Auto-hide toast variant
export function ViolationToast({
    violations,
    onAcknowledge,
}: {
    violations: Violation[];
    onAcknowledge?: (type: string) => void;
}) {
    const [dismissed, setDismissed] = React.useState<string[]>([]);

    const active = violations.filter((v) => !dismissed.includes(v.type));

    if (active.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
            {active.map((v) => (
                <Card
                    key={v.type}
                    className="bg-destructive/10 border-destructive/30 shadow-lg p-3"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-semibold text-xs text-destructive truncate">
                                    {getViolationLabel(v.type)}
                                </p>
                                <p className="text-[10px] text-destructive/80">
                                    {v.count}x · {formatTime(v.timestamp)}
                                </p>
                            </div>
                        </div>
                        {onAcknowledge && (
                            <button
                                onClick={() => {
                                    setDismissed((d) => [...d, v.type]);
                                    onAcknowledge(v.type);
                                }}
                                className="text-[10px] text-destructive hover:underline font-medium px-2 py-0.5"
                            >
                                OK
                            </button>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
}