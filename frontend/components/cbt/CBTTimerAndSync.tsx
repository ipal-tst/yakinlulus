"use client";

import * as React from "react";
import { Clock, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CBTTimerAndSyncProps {
    initialSeconds: number;
    onTimeExpire?: () => void;
}

export function CBTTimerAndSync({ initialSeconds, onTimeExpire }: CBTTimerAndSyncProps) {
    const [secondsLeft, setSecondsLeft] = React.useState(initialSeconds);
    const [isOnline, setIsOnline] = React.useState(true);

    // Independent Countdown Timer
    React.useEffect(() => {
        if (secondsLeft <= 0) {
            onTimeExpire?.();
            return;
        }

        const interval = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [secondsLeft, onTimeExpire]);

    // Network status listener
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const pad = (n: number) => n.toString().padStart(2, "0");

        if (hours > 0) {
            return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
        }
        return `${pad(minutes)}:${pad(secs)}`;
    };

    const isWarning = secondsLeft < 300; // less than 5 mins

    return (
        <div className="flex items-center gap-3">
            {/* Sync Badge */}
            <Badge
                variant={isOnline ? "success" : "warning"}
                className="hidden sm:inline-flex text-xs px-2.5 py-1 font-medium"
            >
                {isOnline ? (
                    <>
                        <Wifi className="mr-1.5 h-3.5 w-3.5" /> Koneksi Stabil (Tersinkron)
                    </>
                ) : (
                    <>
                        <WifiOff className="mr-1.5 h-3.5 w-3.5 animate-pulse" /> Offline - Disimpan Lokal
                    </>
                )}
            </Badge>

            {/* Countdown Timer Display */}
            <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold shadow-xs transition-colors ${isWarning
                        ? "bg-destructive/15 border-destructive text-destructive animate-pulse"
                        : "bg-card border-input text-foreground"
                    }`}
            >
                <Clock className="h-4 w-4" />
                <span>{formatTime(secondsLeft)}</span>
            </div>
        </div>
    );
}
