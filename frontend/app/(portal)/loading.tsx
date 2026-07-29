import * as React from "react";

export default function PortalLoading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center border-b pb-4">
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-muted rounded-lg" />
                    <div className="h-4 w-72 bg-muted/60 rounded-md" />
                </div>
                <div className="h-9 w-32 bg-muted rounded-lg" />
            </div>

            {/* Metric Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-card rounded-xl border p-4 flex items-center gap-4">
                        <div className="h-10 w-10 bg-muted rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-20 bg-muted rounded" />
                            <div className="h-6 w-12 bg-muted/80 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-72 bg-card rounded-2xl border p-6 space-y-4">
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="h-12 w-full bg-muted/40 rounded-xl" />
                    <div className="h-12 w-full bg-muted/40 rounded-xl" />
                    <div className="h-12 w-full bg-muted/40 rounded-xl" />
                </div>
                <div className="h-72 bg-card rounded-2xl border p-6 space-y-4">
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-20 w-full bg-muted/40 rounded-xl" />
                    <div className="h-20 w-full bg-muted/40 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
