"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProgressColor, getProgressLabel } from "@/hooks/use-learn";
import { cn } from "@/lib/utils";
import { BookOpen, FileText, PlayCircle, CheckCircle2 } from "lucide-react";

interface TopicSidebarProps {
    topics: Array<{
        topic_id: string;
        chapter_id: string;
        name: string;
        order_index: number;
        competencies: Array<{
            competency_id: string;
            code: string;
            title: string;
            content_blocks: Array<{
                block_type: string;
                content: string;
            }>;
        }>;
    }>;
    activeTopicId?: string;
    onTopicSelect?: (topicId: string) => void;
    completedTopicIds?: string[];
}

export function TopicSidebar({ topics, activeTopicId, onTopicSelect, completedTopicIds = [] }: TopicSidebarProps) {
    return (
        <div className="sticky top-6 h-fit rounded-xl border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Topik dalam Bab</h3>
            <div className="space-y-2">
                {topics.map((topic) => {
                    const isActive = activeTopicId === topic.topic_id;
                    const isCompleted = completedTopicIds.includes(topic.topic_id);

                    return (
                        <button
                            key={topic.topic_id}
                            onClick={() => onTopicSelect?.(topic.topic_id)}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                                isActive
                                    ? "bg-blue-500/10 text-blue-700 font-medium dark:bg-blue-500/20 dark:text-blue-400"
                                    : "hover:bg-muted/30 text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0",
                                    isCompleted
                                        ? "bg-emerald-500 text-white"
                                        : isActive
                                            ? "bg-blue-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                )}>
                                    {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : topic.order_index}
                                </div>
                                <span className="truncate">{topic.name}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function ContentBlockRenderer({ blocks }: { blocks: Array<{ block_type: string; content: string; title?: string }> }) {
    return (
        <div className="space-y-6">
            {blocks.map((block, idx) => {
                switch (block.block_type) {
                    case "PARAGRAPH":
                    case "TEXT":
                        return (
                            <p key={idx} className="text-sm leading-relaxed text-foreground/90">
                                {block.content}
                            </p>
                        );
                    case "LATEX":
                    case "FORMULA":
                        return (
                            <div key={idx} className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3 font-mono text-sm overflow-x-auto">
                                {block.content}
                            </div>
                        );
                    case "IMAGE":
                    case "GRAPH":
                        return (
                            <div key={idx} className="rounded-xl overflow-hidden">
                                <div className="aspect-video bg-muted/30 flex items-center justify-center">
                                    <span className="text-muted-foreground text-xs">Grafik/Visual</span>
                                </div>
                                <p className="text-xs text-center mt-2 text-muted-foreground">{block.content}</p>
                            </div>
                        );
                    case "VIDEO":
                        return (
                            <div key={idx} className="rounded-xl overflow-hidden bg-black">
                                <div className="aspect-video flex items-center justify-center bg-muted/20">
                                    <div className="text-center">
                                        <PlayCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <span className="text-xs text-muted-foreground">Video: {block.title || "Animasi"}</span>
                                        <p className="text-xs text-muted-foreground mt-1">{block.content}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    case "TABLE":
                        return (
                            <div key={idx} className="rounded-xl overflow-hidden border">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-border/50">
                                            <th className="px-4 py-2 text-xs uppercase text-muted-foreground">Kolom</th>
                                            <th className="px-4 py-2 text-xs uppercase text-muted-foreground">Isi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-border/50">
                                            <td className="px-4 py-2">Data Tabel</td>
                                            <td className="px-4 py-2">{block.content}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    case "CALLOUT":
                        return (
                            <div key={idx} className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-amber-600">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">{block.content}</p>
                                </div>
                            </div>
                        );
                    default:
                        return (
                            <div key={idx} className="rounded-xl bg-muted/30 px-4 py-3 text-sm">
                                <span className="text-muted-foreground text-xs uppercase block mb-1">{block.block_type}</span>
                                {block.content}
                            </div>
                        );
                }
            })}
        </div>
    );
}

export function CompetencyCard({ competency }: { competency: { code: string; title: string; content_blocks: Array<{ block_type: string; content: string }> } }) {
    return (
        <div className="rounded-xl border bg-card p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="font-mono text-xs bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                    {competency.code}
                </Badge>
                <h4 className="font-semibold text-base">{competency.title}</h4>
            </div>
            <div className="space-y-4">
                <ContentBlockRenderer blocks={competency.content_blocks} />
            </div>
        </div>
    );
}
