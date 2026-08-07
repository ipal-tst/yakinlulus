"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { academicMasterService } from "@/services/academic-master.service"
import type { LearningOutcome } from "@/types/academic-master"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface LearningOutcomeExpanderProps {
  topicId: string
}

const getBloomBadgeColor = (level: string) => {
  const l = (level || "").toLowerCase();
  if (l.includes("remember") || l.includes("mengingat") || l.includes("c1"))
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  if (l.includes("understand") || l.includes("memahami") || l.includes("c2"))
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200";
  if (l.includes("apply") || l.includes("menerapkan") || l.includes("c3"))
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200";
  if (l.includes("analyze") || l.includes("menganalisis") || l.includes("c4"))
    return "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200";
  if (l.includes("evaluate") || l.includes("menilai") || l.includes("c5"))
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200";
  return "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200";
};

export default function LearningOutcomeExpander({ topicId }: LearningOutcomeExpanderProps) {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["learning-outcomes", topicId],
    queryFn: () => academicMasterService.getLearningOutcomes(topicId),
    enabled: !!topicId,
  })

  const learningOutcomes = Array.isArray(rawData) ? rawData : [];

  if (isLoading) {
    return (
      <div className="ml-6 my-2 space-y-2">
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    )
  }

  if (learningOutcomes.length === 0) {
    return (
      <div className="ml-6 py-2 text-xs text-muted-foreground italic">
        Belum ada Capaian Pembelajaran (CP/KD) terdaftar.
      </div>
    )
  }

  return (
    <div className="ml-6 my-2 border-l-2 border-primary/20 pl-3">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-border/40">
            <TableHead className="w-24 text-[11px]">Kode CP/KD</TableHead>
            <TableHead className="text-[11px]">Deskripsi Capaian Pembelajaran</TableHead>
            <TableHead className="w-36 text-[11px]">Tingkat Taksonomi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {learningOutcomes.map((lo) => (
            <TableRow key={lo.id} className="hover:bg-muted/40 transition-colors">
              <TableCell className="text-xs font-mono text-muted-foreground">
                {lo.code || `-`}
              </TableCell>
              <TableCell className="text-xs font-medium text-foreground">
                {lo.title}
              </TableCell>
              <TableCell className="text-xs">
                <Badge variant="outline" className={`text-[10px] ${getBloomBadgeColor(lo.bloom_default || "")}`}>
                  {lo.bloom_default || "C1 (Remember)"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
