"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { academicMasterService } from "@/services/academic-master.service"
import LearningOutcomeExpander from "./LearningOutcomeExpander"

interface TopicExpanderProps {
  chapterId: string
}

export default function TopicExpander({ chapterId }: TopicExpanderProps) {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["topics", chapterId],
    queryFn: () => academicMasterService.getTopics(chapterId),
    enabled: !!chapterId,
  })

  const topics = Array.isArray(rawData) ? rawData : [];
  const [isOpen, setIsOpen] = React.useState(true)

  if (isLoading) {
    return <Skeleton className="h-6 w-32 rounded-lg" />
  }

  if (topics.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Belum ada topik
      </span>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold hover:bg-muted rounded-lg transition-colors border border-border/50 text-foreground">
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-primary" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        <span>Topik Materi ({topics.length})</span>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2 pt-1">
        <div className="space-y-2">
          {topics.map((topic, index) => (
            <div key={topic.id} className="p-2.5 rounded-xl border border-border/50 bg-card/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono">
                    #{index + 1}
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">{topic.title}</span>
                </div>
                <Badge variant={topic.is_active !== false ? "success" : "outline"} className="text-[10px] h-4">
                  {topic.is_active !== false ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>

              {/* Learning Outcomes for this topic */}
              <LearningOutcomeExpander topicId={topic.id} />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
