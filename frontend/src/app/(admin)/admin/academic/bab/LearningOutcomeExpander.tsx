"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { academicMasterService } from "@/services/academic-master.service"
import type { LearningOutcome } from "@/types/academic-master"
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

export default function LearningOutcomeExpander({ topicId }: LearningOutcomeExpanderProps) {
  const { data: learningOutcomes = [] } = useQuery({
    queryKey: ["learning-outcomes", topicId],
    queryFn: () => academicMasterService.getLearningOutcomes(topicId),
    enabled: !!topicId,
  })

  if (learningOutcomes.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
        Tidak ada indikator pencapaian pembelajaran
      </div>
    )
  }

  return (
    <div className="ml-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 text-xs">Kode</TableHead>
            <TableHead className="text-xs">Deskripsi</TableHead>
            <TableHead className="w-32 text-xs">Tingkat Bloom</TableHead>
            <TableHead className="w-20 text-right text-xs">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {learningOutcomes.map((lo) => (
            <TableRow key={lo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                {lo.code || "-"}
              </TableCell>
              <TableCell className="text-sm text-slate-800 dark:text-slate-200">
                {lo.title}
              </TableCell>
              <TableCell className="text-xs">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {lo.bloom_default || "-"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <span className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    Edit
                  </span>
                  <span className="cursor-pointer text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    Hapus
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
