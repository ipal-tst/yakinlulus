"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

export interface RadarMetric {
    subtest: string;
    score: number; // 0..1000
    targetScore: number;
    status: "EXCELLENT" | "SAFE" | "BOOST_NEEDED";
}

interface PerformanceRadarChartProps {
    metrics: RadarMetric[];
}

export function PerformanceRadarChart({ metrics }: PerformanceRadarChartProps) {
    const size = 320;
    const center = size / 2;
    const radius = center - 50;
    const numPoints = metrics.length;

    // Helper to calculate coordinates around circle
    const getCoordinates = (index: number, value: number, maxVal = 1000) => {
        const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
        const r = (value / maxVal) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y };
    };

    // Calculate grid circles
    const levels = [0.25, 0.5, 0.75, 1.0];

    // User score polygon path
    const userPoints = metrics.map((m, i) => {
        const { x, y } = getCoordinates(i, m.score);
        return `${x},${y}`;
    }).join(" ");

    // Target score polygon path
    const targetPoints = metrics.map((m, i) => {
        const { x, y } = getCoordinates(i, m.targetScore);
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="flex flex-col items-center justify-center relative">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Concentric Polygon Grids */}
                {levels.map((lvl, idx) => {
                    const points = metrics.map((_, i) => {
                        const { x, y } = getCoordinates(i, lvl * 1000);
                        return `${x},${y}`;
                    }).join(" ");

                    return (
                        <polygon
                            key={idx}
                            points={points}
                            className="fill-none stroke-muted-foreground/20"
                            strokeWidth="1"
                            strokeDasharray={lvl === 1 ? "none" : "2,2"}
                        />
                    );
                })}

                {/* Axes Lines */}
                {metrics.map((_, i) => {
                    const { x, y } = getCoordinates(i, 1000);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            className="stroke-muted-foreground/20"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Target Score Polygon (Dashed Purple) */}
                <polygon
                    points={targetPoints}
                    className="fill-secondary/20 stroke-primary/50"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                />

                {/* User Current Score Polygon (Filled Primary) */}
                <polygon
                    points={userPoints}
                    className="fill-primary/25 stroke-primary"
                    strokeWidth="2.5"
                />

                {/* Outer Data Points */}
                {metrics.map((m, i) => {
                    const { x, y } = getCoordinates(i, m.score);
                    const isBoost = m.status === "BOOST_NEEDED";

                    return (
                        <g key={i}>
                            <circle
                                cx={x}
                                cy={y}
                                r="5"
                                className={isBoost ? "fill-warning stroke-background" : "fill-primary stroke-background"}
                                strokeWidth="2"
                            />
                        </g>
                    );
                })}

                {/* Axis Labels */}
                {metrics.map((m, i) => {
                    const { x, y } = getCoordinates(i, 1180);
                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[10px] font-bold fill-foreground"
                        >
                            {m.subtest.split(" ")[0]}
                        </text>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs mt-4">
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs bg-primary/40 border border-primary inline-block" />
                    <span className="font-medium">Skor IRT Anda</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs bg-secondary/40 border border-primary/50 border-dashed inline-block" />
                    <span className="font-medium">Target UTBK PTN</span>
                </div>
            </div>
        </div>
    );
}
