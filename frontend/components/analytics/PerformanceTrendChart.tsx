"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

export interface TrendPoint {
    tryoutTitle: string;
    date: string;
    score: number;
}

interface PerformanceTrendChartProps {
    data: TrendPoint[];
    targetCutoff: number;
}

export function PerformanceTrendChart({ data, targetCutoff }: PerformanceTrendChartProps) {
    const width = 500;
    const height = 220;
    const padding = 40;

    const minScore = 500;
    const maxScore = 800;

    const getX = (index: number) => {
        if (data.length <= 1) return padding;
        return padding + (index / (data.length - 1)) * (width - padding * 2);
    };

    const getY = (score: number) => {
        return height - padding - ((score - minScore) / (maxScore - minScore)) * (height - padding * 2);
    };

    const linePoints = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(" ");
    const cutoffY = getY(targetCutoff);

    return (
        <div className="flex flex-col items-center justify-center space-y-3 w-full">
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                {/* Horizontal Grid lines */}
                {[550, 600, 650, 700, 750].map((scoreVal) => {
                    const y = getY(scoreVal);
                    return (
                        <g key={scoreVal}>
                            <line
                                x1={padding}
                                y1={y}
                                x2={width - padding}
                                y2={y}
                                className="stroke-muted-foreground/15"
                                strokeWidth="1"
                            />
                            <text
                                x={padding - 8}
                                y={y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                className="text-[9px] fill-muted-foreground font-mono"
                            >
                                {scoreVal}
                            </text>
                        </g>
                    );
                })}

                {/* Target Score Cutoff Line (Dashed Warning Red/Purple) */}
                <g>
                    <line
                        x1={padding}
                        y1={cutoffY}
                        x2={width - padding}
                        y2={cutoffY}
                        className="stroke-warning"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                    />
                    <text
                        x={width - padding + 5}
                        y={cutoffY}
                        dominantBaseline="middle"
                        className="text-[9px] font-bold fill-warning font-mono"
                    >
                        Target ({targetCutoff})
                    </text>
                </g>

                {/* Trend Score Line */}
                <polyline
                    fill="none"
                    points={linePoints}
                    className="stroke-primary"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data Points and Value Badges */}
                {data.map((d, i) => {
                    const cx = getX(i);
                    const cy = getY(d.score);
                    const isAbove = d.score >= targetCutoff;

                    return (
                        <g key={i} className="group cursor-pointer">
                            <circle
                                cx={cx}
                                cy={cy}
                                r="5"
                                className={isAbove ? "fill-success stroke-background" : "fill-primary stroke-background"}
                                strokeWidth="2"
                            />
                            <text
                                x={cx}
                                y={cy - 12}
                                textAnchor="middle"
                                className="text-[10px] font-mono font-bold fill-foreground"
                            >
                                {d.score}
                            </text>
                            <text
                                x={cx}
                                y={height - 10}
                                textAnchor="middle"
                                className="text-[9px] fill-muted-foreground"
                            >
                                {d.tryoutTitle.split(" ")[0]}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
