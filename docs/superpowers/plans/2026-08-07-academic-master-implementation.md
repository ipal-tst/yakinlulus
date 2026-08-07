# Academic Master Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Master Akademik page at `/admin/academic` for STAFF/SUPER_ADMIN to CRUD academic hierarchy (Education Level → Grade → Subject → Chapter → Topic → Learning Outcome).

**Architecture:** Single-page admin module with cascading filter dropdowns, context-aware table rendering, and isolated form dialogs. Uses TanStack Query for data fetching, React Hook Form + Zod for validation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, TanStack Table, React Hook Form, Zod, Lucide React

## Global Constraints

- Route `/admin/academic` only accessible by SUPER_ADMIN and STAFF (backend middleware)
- GURU/FINANCE/INVESTOR get 403 on any write; menu item hidden
- shadcn/ui preset Nova (project standard)
- No framer-motion/animations in admin panel
- Breadcrumb: max 3 items visible, overflow truncated
- All dates in ISO 8601
- UUIDs as string (no parsing in client)
- API base: `http://localhost:8080/api/v1`
- HTTP 403 for unauthorized, 401 for expired token

---

## File Structure

| File | Purpose |
|------|---------|
| `frontend/src/services/academic-master.service.ts` | API client |
| `frontend/src/types/academic-master.ts` | Type definitions |
| `frontend/src/app/(admin)/admin/academic/page.tsx` | Main page |
| `frontend/src/app/(admin)/admin/academic/AcademicFilterBar.tsx` | Filter dropdowns |
| `frontend/src/app/(admin)/admin/academic/AcademicBreadcrumb.tsx` | Breadcrumb |
| `frontend/src/app/(admin)/admin/academic/AcademicTableRenderer.tsx` | Context table |
| `frontend/src/app/(admin)/admin/academic/bab/BabTable.tsx` | Bab table |
| `frontend/src/app/(admin)/admin/academic/bab/TopicExpander.tsx` | Topik expander |
| `frontend/src/app/(admin)/admin/academic/bab/LearningOutcomeExpander.tsx` | LO expander |
| `frontend/src/app/(admin)/admin/academic/forms/LevelFormDialog.tsx` | Create/edit Jenjang |
| `frontend/src/app/(admin)/admin/academic/forms/GradeFormDialog.tsx` | Create/edit Kelas |
| `frontend/src/app/(admin)/admin/academic/forms/SubjectFormDialog.tsx` | Create/edit Mapel |
| `frontend/src/app/(admin)/admin/academic/forms/ChapterFormDialog.tsx` | Create/edit Bab |
| `frontend/src/app/(admin)/admin/academic/forms/TopicFormDialog.tsx` | Create/edit Topik |
| `frontend/src/app/(admin)/admin/academic/forms/LearningOutcomeFormDialog.tsx` | Create/edit LO |
| `frontend/src/components/layout/sidebar.tsx` | Add menu item |

---

## Task 1: API Service & Types

**Files:**
- Create: `frontend/src/services/academic-master.service.ts`
- Create: `frontend/src/types/academic-master.ts`

**Interfaces:**
- Consumes: `/api/v1/academic/*` endpoints (verified in backend)
- Produces: `AcademicMasterService` object with CRUD methods for Levels, Grades, Subjects, Chapters, Topics, LearningOutcomes

- [ ] **Step 1: Create type file with all entity types**

```typescript
// frontend/src/types/academic-master.ts
export type EducationLevel = {
  id: string;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Grade = {
  id: string;
  education_level_id: string;
  level_code: string;
  name: string;
  alias?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  level_id: string;
  grade_id?: string | null;
  level_code: string;
  level_name: string;
  grade_code: string;
  grade_name: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Chapter = {
  id: string;
  subject_id: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subject_name?: string;
};

export type Topic = {
  id: string;
  chapter_id: string;
  title: string;
  description?: string | null;
  sequence: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LearningOutcome = {
  id: string;
  topic_id: string;
  code?: string | null;
  title: string;
  sequence: number;
  bloom_default?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BloomLevel = 'PENGETAHUAN' | 'PEMAHAMAN' | 'DUKTI' | 'AKSES' | 'ANALISIS' | 'EVALUASI' | 'MELAKUKAN' | 'MEMBERIKAN';

export type CreateLevelReq = Omit<EducationLevel, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLevelReq = Partial<CreateLevelReq>;
export type CreateGradeReq = { education_level_id: string; name: string; alias?: string; display_order?: number; is_active?: boolean };
export type UpdateGradeReq = Partial<CreateGradeReq>;
export type CreateSubjectReq = { education_level_id: string; grade_id?: string | null; name: string; code: string; description?: string; display_order?: number };
export type UpdateSubjectReq = Partial<CreateSubjectReq>;
export type CreateChapterReq = { subject_id: string; name: string; description?: string; display_order?: number };
export type UpdateChapterReq = Partial<CreateChapterReq>;
export type CreateTopicReq = { chapter_id: string; title: string; description?: string; sequence?: number };
export type UpdateTopicReq = Partial<CreateTopicReq>;
export type CreateLearningOutcomeReq = { topic_id: string; code?: string; title: string; sequence?: number; bloom_default?: string; description?: string };
export type UpdateLearningOutcomeReq = Partial<CreateLearningOutcomeReq>;
```

- [ ] **Step 2: Create API service with all CRUD methods**

```typescript
// frontend/src/services/academic-master.service.ts
import { api } from "@/lib/api";

export const academicMasterService = {
  // Levels
  getLevels: () => api<EducationLevel[]>("/academic/levels"),
  getLevel: (id: string) => api<EducationLevel>(`/academic/levels/${id}`),
  createLevel: (data: CreateLevelReq) => api<EducationLevel>("/academic/levels", { method: "POST", body: data }),
  updateLevel: (id: string, data: UpdateLevelReq) => api<EducationLevel>(`/academic/levels/${id}`, { method: "PUT", body: data }),
  deleteLevel: (id: string) => api<{ message: string }>(`/academic/levels/${id}`, { method: "DELETE" }),

  // Grades
  getGrades: (levelId: string) => api<Grade[]>(`/academic/grades?level_id=${levelId}`),
  createGrade: (data: CreateGradeReq) => api<Grade>("/academic/grades", { method: "POST", body: data }),
  updateGrade: (id: string, data: UpdateGradeReq) => api<Grade>(`/academic/grades/${id}`, { method: "PUT", body: data }),
  deleteGrade: (id: string) => api<{ message: string }>(`/academic/grades/${id}`, { method: "DELETE" }),

  // Subjects  
  getSubjects: (levelId: string, gradeId: string) => api<Subject[]>(`/academic/subjects?education_level_id=${levelId}&grade_id=${gradeId}`),
  createSubject: (data: CreateSubjectReq) => api<Subject>("/academic/subjects", { method: "POST", body: data }),
  updateSubject: (id: string, data: UpdateSubjectReq) => api<Subject>(`/academic/subjects/${id}`, { method: "PUT", body: data }),
  deleteSubject: (id: string) => api<{ message: string }>(`/academic/subjects/${id}`, { method: "DELETE" }),

  // Chapters
  getChapters: (subjectId: string) => api<Chapter[]>(`/academic/chapters?subject_id=${subjectId}`),
  createChapter: (data: CreateChapterReq) => api<Chapter>("/academic/chapters", { method: "POST", body: data }),
  updateChapter: (id: string, data: UpdateChapterReq) => api<Chapter>(`/academic/chapters/${id}`, { method: "PUT", body: data }),
  deleteChapter: (id: string) => api<{ message: string }>(`/academic/chapters/${id}`, { method: "DELETE" }),

  // Topics
  getTopics: (chapterId: string) => api<Topic[]>(`/academic/topics?chapter_id=${chapterId}`),
  createTopic: (data: CreateTopicReq) => api<Topic>("/academic/topics", { method: "POST", body: data }),
  updateTopic: (id: string, data: UpdateTopicReq) => api<Topic>(`/academic/topics/${id}`, { method: "PUT", body: data }),
  deleteTopic: (id: string) => api<{ message: string }>(`/academic/topics/${id}`, { method: "DELETE" }),

  // Learning Outcomes
  getLearningOutcomes: (topicId: string) => api<LearningOutcome[]>(`/academic/learning-outcomes?topic_id=${topicId}`),
  createLearningOutcome: (data: CreateLearningOutcomeReq) => api<LearningOutcome>("/academic/learning-outcomes", { method: "POST", body: data }),
  updateLearningOutcome: (id: string, data: UpdateLearningOutcomeReq) => api<LearningOutcome>(`/academic/learning-outcomes/${id}`, { method: "PUT", body: data }),
  deleteLearningOutcome: (id: string) => api<{ message: string }>(`/academic/learning-outcomes/${id}`, { method: "DELETE" }),
};
```

- [ ] **Step 3: Build and type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS, no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/academic-master.service.ts frontend/src/types/academic-master.ts
git commit -m "feat(academic): add API service and types for master module"
```

---

## Task 2: Level Form Dialog

**Files:**
- Create: `frontend/src/app/(admin)/admin/academic/forms/LevelFormDialog.tsx`
- Create: `frontend/src/test/__mocks__/academic-master.ts` (for testing)

**Interfaces:**
- Consumes: `academicMasterService.createLevel`, `academicMasterService.updateLevel`
- Produces: `LevelFormDialog` component

- [ ] **Step 1: Create Zod schema for validation**

```typescript
// In LevelFormDialog.tsx
import * as z from "zod";

export const levelSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(100, "Maksimal 100 karakter"),
  code: z.string().min(1, "Kode harus diisi").max(10, "Maksimal 10 karakter").toUpperCase(),
  display_order: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export type LevelFormValues = z.infer<typeof levelSchema>;
```

- [ ] **Step 2: Create the Dialog component**

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { academicMasterService } from "@/services/academic-master";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LevelFormValues, EducationLevel } from "@/types/academic-master";
import { Loader2 } from "lucide-react";

interface LevelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: EducationLevel | null;
}

export function LevelFormDialog({ open, onOpenChange, editing }: LevelFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!editing;

  const form = useForm<LevelFormValues>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      name: editing?.name || "",
      code: editing?.code || "",
      display_order: editing?.display_order || 1,
      is_active: editing?.is_active ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: LevelFormValues) =>
      isEdit
        ? academicMasterService.updateLevel(editing!.id, data)
        : academicMasterService.createLevel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
      toast({ title: isEdit ? "Jenjang diperbarui" : "Jenjang dibuat" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Gagal menyimpan" });
    },
  });

  const onSubmit = (data: LevelFormValues) => mutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Jenjang" : "Tambah Jenjang"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="SD, SMP, SMA, dll" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode</FormLabel>
                  <FormControl>
                    <Input placeholder="SD" capitalizes {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Aktif</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Simpan" : "Buat"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit frontend/src/app/.../LevelFormDialog.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/(admin)/admin/academic/forms/LevelFormDialog.tsx
git commit -m "feat(academic): add LevelFormDialog component"
```

---

## Parallel Tasks (2.1-2.6)

Following tasks for GradeFormDialog, SubjectFormDialog, ChapterFormDialog, TopicFormDialog, LearningOutcomeFormDialog follow identical pattern — adjust form fields per entity. Execute in parallel via subagent dispatch.

---

## Task 3: BabTable with Expanders

**Files:**
- Create: `frontend/src/app/(admin)/admin/academic/bab/BabTable.tsx`
- Create: `frontend/src/app/(admin)/admin/academic/bab/TopicExpander.tsx`
- Create: `frontend/src/app/(admin)/admin/academic/bab/LearningOutcomeExpander.tsx`

**Interfaces:**
- Consumes: `academicMasterService.getChapters`, `getTopics`, `getLearningOutcomes`
- Produces: `BabTable` with nested expandable rows

- [ ] **Step 1: Create LearningOutcomeExpander (leaves nested)**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { academicMasterService } from "@/services/academic-master";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Badge } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function LearningOutcomeExpander({ topicId }: { topicId: string }) {
  const { data: outcomes, isLoading } = useQuery({
    queryKey: ["learning-outcomes", topicId],
    queryFn: () => academicMasterService.getLearningOutcomes(topicId),
    enabled: !!topicId,
  });

  if (isLoading) return <div className="text-sm">Memuat...</div>;

  return (
    <Table>
      <TableBody>
        {outcomes?.map((lo) => (
          <TableRow key={lo.id} className="text-sm">
            <TableCell className="font-medium">{lo.code}</TableCell>
            <TableCell>{lo.title}</TableCell>
            <TableCell><Badge variant="outline">{lo.bloom_default}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: Create TopicExpander (nested under Bab)**

```tsx
"use client";

import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Chapter, Topic } from "@/types/academic-master";

interface TopicExpanderProps {
  chapter: Chapter;
}

export function TopicExpander({ chapter }: TopicExpanderProps) {
  const [openTopicIds, setOpenTopicIds] = useState<Set<string>>(new Set());

  const toggleTopic = (id: string) => {
    const newSet = new Set(openTopicIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setOpenTopicIds(newSet);
  };

  // Fetch topics via useQuery (omitted for brevity - same pattern)
  // ...

  return (
    <Table>
      <TableBody>
        {topics?.map((topic: Topic) => (
          <React.Fragment key={topic.id}>
            <TableRow>
              <TableCell colSpan={4} className="p-0">
                <Collapsible open={openTopicIds.has(topic.id)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTopic(topic.id)}
                      className="w-full justify-start px-2"
                    >
                      <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${openTopicIds.has(topic.id) ? 'rotate-180' : ''}`} />
                      {topic.title}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} className="p-0">
                <Collapsible open={openTopicIds.has(topic.id)}>
                  <CollapsibleContent>
                    <LearningOutcomeExpander topicId={topic.id} />
                  </CollapsibleContent>
                </Collapsible>
              </TableCell>
            </TableRow>
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 3: Create BabTable main table**

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { academicMasterService } from "@/services/academic-master";
import { TopicExpander } from "./TopicExpander";
import type { Chapter, Subject } from "@/types/academic-master";

interface BabTableProps {
  subject: Subject;
}

export function BabTable({ subject }: BabTableProps) {
  const [openChapterId, setOpenChapterId] = useState<string | null>(null);

  const { data: chapters, isLoading } = useQuery({
    queryKey: ["chapters", subject.id],
    queryFn: () => academicMasterService.getChapters(subject.id),
    enabled: !!subject.id,
  });

  if (isLoading) return <div className="text-center py-8">Memuat bab...</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No</TableHead>
          <TableHead>Nama Bab</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {chapters?.map((chapter: Chapter, idx: number) => (
          <React.Fragment key={chapter.id}>
            <TableRow>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{chapter.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {chapter.description?.substring(0, 50) || "-"}
              </TableCell>
              <TableCell>
                <Badge variant={chapter.is_active ? "default" : "secondary"}>
                  {chapter.is_active ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Hapus</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <Collapsible open={openChapterId === chapter.id}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-4"
                      onClick={() => setOpenChapterId(openChapterId === chapter.id ? null : chapter.id)}
                    >
                      <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${openChapterId === chapter.id ? 'rotate-180' : ''}`} />
                      Daftar Topik ({chapter.topik_count || 0})
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <TopicExpander chapter={chapter} />
                  </CollapsibleContent>
                </Collapsible>
              </TableCell>
            </TableRow>
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Commit all components**

```bash
git add frontend/src/app/(admin)/admin/academic/bab/
git commit -m "feat(academic): add BabTable with Topic and LearningOutcome expanders"
```

---

## Task 4: Filter Bar & Breadcrumb

**Files:**
- Create: `frontend/src/app/(admin)/admin/academic/AcademicFilterBar.tsx`
- Create: `frontend/src/app/(admin)/admin/academic/AcademicBreadcrumb.tsx`

**Interfaces:**
- Produces: Filter state (jealous, grade, subject) + breadcrumb items

- [ ] **Step 1: Create Breadcrumb component**

```tsx
"use client";

import Link from "next/link";

interface AcademicBreadcrumbProps {
  levels?: string[];
  className?: string;
}

export function AcademicBreadcrumb({ levels = [], className }: AcademicBreadcrumbProps) {
  if (levels.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
      <ol className="flex items-center space-x-2">
        {levels.map((item, i) => {
          if (i === levels.length - 1) {
            return (
              <li key={i} className="text-muted-foreground">
                {item}
              </li>
            );
          }
          return (
            <li key={i}>
              <Link href={levels.slice(0, i + 1).join('/')} className="text-primary hover:underline">
                {item}
              </Link>
              <span className="mx-2 text-muted-foreground">/</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: Create FilterBar with cascading selects**

```tsx
"use client";

import { Select, SelectContent,SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FilterBarProps {
  levels: any[];
  grades: any[];
  subjects: any[];
  selectedLevel: string | null;
  selectedGrade: string | null;
  selectedSubject: string | null;
  onLevelChange: (id: string | null) => void;
  onGradeChange: (id: string | null) => void;
  onSubjectChange: (id: string | null) => void;
  onAddLevel: () => void;
  onAddGrade: () => void;
  onAddSubject: () => void;
}

export function AcademicFilterBar({
  levels, grades, subjects, selectedLevel, selectedGrade, selectedSubject,
  onLevelChange, onGradeChange, onSubjectChange,
  onAddLevel, onAddGrade, onAddSubject,
}: FilterBarProps) {
  return (
    <div className="flex gap-4 items-center mb-6">
      <div className="flex items-center gap-2">
        <Select onValueChange={onLevelChange} value={selectedLevel || ""}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Jenjang" />
          </SelectTrigger>
          <SelectContent>
            {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={onAddLevel}><Plus className="h-4 w-4" /></Button>
      </div>

      <div className="flex items-center gap-2">
        <Select
          onValueChange={onGradeChange}
          value={selectedGrade || ""}
          disabled={!selectedLevel}
        >
          <SelectTrigger className="w-[180px]" disabled={!selectedLevel}>
            <SelectValue placeholder={selectedLevel ? "Pilih Kelas" : "Pilih Jenjang"} />
          </SelectTrigger>
          <SelectContent>
            {grades.map(g => <SelectItem key={g.id} value={g.id}>{g.name} ({g.level_code})</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={onAddGrade} disabled={!selectedLevel}><Plus className="h-4 w-4" /></Button>
      </div>

      <div className="flex items-center gap-2">
        <Select
          onValueChange={onSubjectChange}
          value={selectedSubject || ""}
          disabled={!selectedGrade}
        >
          <SelectTrigger className="w-[240px]" disabled={!selectedGrade}>
            <SelectValue placeholder={selectedGrade ? "Pilih Mapel" : "Pilih Kelas"} />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={onAddSubject} disabled={!selectedGrade}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/(admin)/admin/academic/AcademicFilterBar.tsx frontend/src/app/(admin)/admin/academic/AcademicBreadcrumb.tsx
git commit -m "feat(academic): add FilterBar and Breadcrumb components"
```

---

## Task 5: Main Page Container

**Files:**
- Create: `frontend/src/app/(admin)/admin/academic/page.tsx`

**Interfaces:**
- Combines: FilterBar, Breadcrumb, AcademicTableRenderer
- Manages: cascading filter state via TanStack Query

- [ ] **Step 1: Create main page with state management**

```tsx
import { AcademicFilterBar } from "./AcademicFilterBar";
import { AcademicBreadcrumb } from "./AcademicBreadcrumb";
import { EducationalLevelTable } from "./EducationalLevelTable";
import { GradeTable } from "./GradeTable";
import { SubjectTable } from "./SubjectTable";
import { BabTable } from "./bab/BabTable";

export default function AcademicMasterPage() {
  // TanStack Query hooks for each entity list
  // useState for cascading filter selection
  // Render appropriate table based on selection depth

  return (
    <main className="container mx-auto py-6 space-y-4">
      <h1 className="text-2xl font-bold">Master Akademik</h1>
      <AcademicFilterBar
        // props
      />
      <AcademicBreadcrumb levels={breadcrumbItems} />
      <div className="rounded-lg border bg-card">
        {renderCurrentLevel()}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add sidebar menu item**

Modify `frontend/src/components/layout/sidebar.tsx`:
- Add import: `GraduationCap` from lucide-react
- Add to STAFF_NAV: `{ title: "Master Akademik", href: "/admin/academic", icon: GraduationCap }`

- [ ] **Step 3: Type-check and lint**

Run: `cd frontend && npx tsc --noEmit && npx eslint app/(admin)/admin/academic`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/(admin)/admin/academic/page.tsx frontend/src/components/layout/sidebar.tsx
git commit -m "feat(academic): add main page and sidebar menu"
```

---

## Task 6: Testing & Verification

- [ ] **Step 1: Run frontend type check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint
```
Expected: PASS, no errors

- [ ] **Step 3: Manual verification**

1. `npm run dev` on frontend
2. Login as STAFF account
3. Verify sidebar shows "Master Akademik"
4. Navigate to `/admin/academic`
5. Verify filter bar (Jenjang, Kelas, Mapop)
6. Verify entity tables render correctly

- [ ] **Step 4: Commit all**

```bash
git add .
git commit -m "feat(academic): complete Academic Master module"
```

---