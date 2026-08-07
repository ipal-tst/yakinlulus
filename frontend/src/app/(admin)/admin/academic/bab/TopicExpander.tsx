"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import type { Topic } from "@/types/academic-master"
import LearningOutcomeExpander from "./LearningOutcomeExpander"

interface TopicExpanderProps {
  chapterId: string
}

export default function TopicExpander({ chapterId }: TopicExpanderProps) {
  const { data: topics = [] } = useQuery({
    queryKey: ["topics", chapterId],
    queryFn: () => academicMasterService.getTopics(chapterId),
    enabled: !!chapterId,
  })

  const [isOpen, setIsOpen] = React.useState(true)

  if (topics.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
        Tidak ada topik
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="w-full">
        <CollapsibleTrigger>
          <Button variant="ghost" className="h-8 w-full justify-start px-4">
            <div className="mr-2">
              {isOpen ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </div>
            <span className="text-sm font-medium">
              Topik ({topics.length})
            </span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="ml-4">
          <Table>
            <TableBody>
              {topics.map((topic, index) => (
                <React.Fragment key={topic.id}>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="w-8 font-medium text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {topic.title}
                    </TableCell>
                    <TableCell className="text-sm">
                      <LearningOutcomeExpander topicId={topic.id} />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          topic.is_active
                            ? "border-transparent bg-green-500 text-white"
                            : "border-transparent bg-slate-500 text-white"
                        }`}
                      >
                        {topic.is_active ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </TableCell>
                  </TableRow>
                  <Collapsible key={topic.id} className="ml-4">
                    <LearningOutcomeExpander topicId={topic.id} />
                  </Collapsible>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
