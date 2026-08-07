import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    trend?: {
        value: number; // e.g. +12.5 or -5
        label?: string; // e.g. "vs minggu lalu"
    };
    icon?: LucideIcon;
    iconBgColor?: string;
    className?: string;
}

export function StatsCard({
    title,
    value,
    description,
    trend,
    icon: Icon,
    className,
}: StatsCardProps) {
    const isPositive = trend && trend.value >= 0;

    return (
        <div
            className={cn(
                "rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="font-heading text-2xl font-bold tracking-tight text-foreground mt-1">
                        {value}
                    </h3>
                </div>
                {Icon && (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Icon className="h-6 w-6" />
                    </div>
                )}
            </div>

            {(trend || description) && (
                <div className="flex items-center gap-2 mt-4 text-xs">
                    {trend && (
                        <span
                            className={cn(
                                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold",
                                isPositive
                                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            )}
                        >
                            {isPositive ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            {isPositive ? `+${trend.value}%` : `${trend.value}%`}
                        </span>
                    )}
                    <span className="text-muted-foreground">
                        {trend?.label || description}
                    </span>
                </div>
            )}
        </div>
    );
}
