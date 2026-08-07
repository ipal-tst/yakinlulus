"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { MoreHorizontal, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { academicMasterService } from "@/services/academic-master.service"
import TopicExpander from "./TopicExpander"

interface BabTableProps {
  subjectId: string
}

export default function BabTable({ subjectId }: BabTableProps) {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["chapters", subjectId],
    queryFn: () => academicMasterService.getChapters(subjectId),
    enabled: !!subjectId,
  })

  const chapters = Array.isArray(rawData) ? rawData : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center bg-muted/20">
        <div className="rounded-2xl bg-muted p-4 text-muted-foreground">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum Ada Bab Materi
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          Mata pelajaran ini belum memiliki daftar bab di database. Anda dapat menambahkan bab baru melalui tombol di atas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 text-xs">No</TableHead>
            <TableHead className="text-xs">Nama Bab &amp; Detail</TableHead>
            <TableHead className="text-xs">Daftar Topik &amp; CP/KD</TableHead>
            <TableHead className="w-24 text-xs">Status</TableHead>
            <TableHead className="w-16 text-right text-xs">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.map((chapter, index) => (
            <TableRow key={chapter.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="text-xs font-mono text-muted-foreground pt-4 align-top">
                {index + 1}
              </TableCell>
              <TableCell className="pt-3 align-top">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-foreground block">{chapter.name}</span>
                  {chapter.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{chapter.description}</p>
                  )}
                  {chapter.display_order !== undefined && (
                    <span className="text-[10px] text-muted-foreground/70 font-mono">
                      Urutan: Bab {chapter.display_order}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="pt-3 align-top">
                <TopicExpander chapterId={chapter.id} />
              </TableCell>
              <TableCell className="pt-3 align-top">
                <Badge variant={chapter.is_active !== false ? "success" : "outline"} className="text-xs">
                  {chapter.is_active !== false ? "Aktif" : "Non-aktif"}
                </Badge>
              </TableCell>
              <TableCell className="text-right pt-3 align-top">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem className="text-xs gap-2">
                      Edit Detail Bab
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
