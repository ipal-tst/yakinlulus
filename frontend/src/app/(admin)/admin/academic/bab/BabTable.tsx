"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { academicMasterService } from "@/services/academic-master.service"
import type { Chapter } from "@/types/academic-master"
import TopicExpander from "./TopicExpander"

interface BabTableProps {
  subjectId: string
}

export default function BabTable({ subjectId }: BabTableProps) {
  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ["chapters", subjectId],
    queryFn: () => academicMasterService.getChapters(subjectId),
    enabled: !!subjectId,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
        <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
          <MoreHorizontalIcon className="size-8 text-slate-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          Belum ada Bab
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Bab untuk mata pelajaran ini belum ditambahkan
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">No</TableHead>
            <TableHead>Nama Bab</TableHead>
            <TableHead>Jumlah Topik</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.map((chapter, index) => (
            <Collapsible key={chapter.id} className="group">
              <TableRow>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{chapter.name}</TableCell>
                <TableCell>
                  <TopicExpander chapterId={chapter.id} />
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      chapter.is_active
                        ? "border-transparent bg-green-500 text-white"
                        : "border-transparent bg-slate-500 text-white"
                    }`}
                  >
                    {chapter.is_active ? "Aktif" : "Tidak Aktif"}
                  </span>
                </TableCell>
                 <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <PencilIcon className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive">
                        <Trash2Icon className="mr-2 size-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <CollapsibleContent>
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <div className="ml-8 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                      <TopicExpander chapterId={chapter.id} />
                    </div>
                  </TableCell>
                </TableRow>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
