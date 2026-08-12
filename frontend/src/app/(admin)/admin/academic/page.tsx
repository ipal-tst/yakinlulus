"use client";

import { useState } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { GraduationCap, Filter, Plus, ChevronRight, Home, AlertCircle, BookOpen, Upload, RefreshCw } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { academicMasterService } from "@/services/academic-master.service";
import type { Curriculum, Program, EducationLevel, Grade, Subject } from "@/types/academic-master";
import { LevelTable } from "@/components/table/LevelTable";
import { GradeTable } from "@/components/table/GradeTable";
import { SubjectTable } from "@/components/table/SubjectTable";
import BabTable from "./bab/BabTable";
import { AcademicStatsOverview } from "@/components/admin/academic/AcademicStatsOverview";
import { LevelFormDialog } from "./forms/LevelFormDialog";
import { GradeFormDialog } from "./forms/GradeFormDialog";
import { SubjectFormDialog } from "./forms/SubjectFormDialog";
import { CurriculumFormDialog } from "./forms/CurriculumFormDialog";
import { ProgramFormDialog } from "./forms/ProgramFormDialog";
import { SubjectsTab } from "./tabs/subjects-tab";
import { CurriculumsTab } from "./tabs/curriculums-tab";
import { ProgramsTab } from "./tabs/programs-tab";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminAcademicPage() {
  const [activeTab, setActiveTab] = useState("hierarchy");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [editingLevel, setEditingLevel] = useState<EducationLevel | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editingSubject, setEditingSubject] = useState<{
    id: string;
    education_level_id: string;
    grade_id?: string | null;
    name: string;
    code: string;
    description?: string | null;
    display_order: number;
  } | null>(null);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Form dialog states
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);

  // Fetch data based on selection
  const levelsQuery = useQuery({
    queryKey: ["academic-levels"],
    queryFn: academicMasterService.getLevels,
  });

  const gradesQuery = useQuery({
    queryKey: ["academic-grades", selectedLevel],
    queryFn: () => selectedLevel ? academicMasterService.getGrades(selectedLevel) : Promise.resolve([]),
    enabled: !!selectedLevel,
  });

  const subjectsQuery = useQuery({
    queryKey: ["academic-subjects", selectedLevel, selectedGrade, filterStatus],
    queryFn: () => selectedLevel && selectedGrade
      ? academicMasterService.getSubjects(selectedLevel, selectedGrade, filterStatus)
      : Promise.resolve([]),
    enabled: !!selectedLevel && !!selectedGrade,
  });

  // Global subjects query for Mapel tab and KPI overview
  const allSubjectsQuery = useQuery({
    queryKey: ["academic-all-subjects", filterStatus],
    queryFn: () => academicMasterService.getSubjects(undefined, undefined, filterStatus),
  });

  const curriculumsQuery = useQuery({
    queryKey: ["academic-curriculums", filterStatus],
    queryFn: () => academicMasterService.getCurriculums(filterStatus),
  });

  const programsQuery = useQuery({
    queryKey: ["academic-programs", filterStatus],
    queryFn: () => academicMasterService.getPrograms(filterStatus),
  });

  const selectedLevelData = selectedLevel ? levelsQuery.data?.find(l => l.id === selectedLevel) : null;
  const selectedGradeData = selectedGrade ? gradesQuery.data?.find(g => g.id === selectedGrade) : null;
  const selectedSubjectData = selectedSubject ? (
    subjectsQuery.data?.find(s => s.id === selectedSubject) ||
    allSubjectsQuery.data?.find(s => s.id === selectedSubject)
  ) : null;

  const handleGradeSelect = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedSubject(null);
  };

  const handleSubjectSelect = (subjectId: string) => {
    setActiveTab("hierarchy");
    setSelectedSubject(subjectId);
  };

  const handleBack = () => {
    if (selectedSubject) {
      setSelectedSubject(null);
    } else if (selectedGrade) {
      setSelectedGrade(null);
    } else if (selectedLevel) {
      setSelectedLevel(null);
    }
  };

  const renderHierarchyContent = () => {
    if (selectedSubject) {
      return <BabTable subjectId={selectedSubject} />;
    }

    if (selectedGrade) {
      const filteredSubjects = (subjectsQuery.data || []).filter((s) =>
        !selectedLevel || s.level_id === selectedLevel
      );
      return (
        <SubjectTable
          subjects={filteredSubjects}
          onSelect={handleSubjectSelect}
          onEdit={(s) => { setEditingSubject({ id: s.id, education_level_id: s.level_id, grade_id: s.grade_id, name: s.name, code: s.code, description: s.description, display_order: s.display_order }); setSubjectDialogOpen(true); }}
          selectedSubject={selectedSubject}
        />
      );
    }

    if (selectedLevel) {
      return (
        <GradeTable
          grades={gradesQuery.data?.map(g => ({ ...g, alias: g.alias ?? null })) || []}
          onSelect={handleGradeSelect}
          onEdit={(grade) => { setEditingGrade(grade); setGradeDialogOpen(true); }}
          selectedGrade={selectedGrade}
        />
      );
    }

    return (
      <LevelTable
        levels={levelsQuery.data || []}
        onSelect={(levelId) => setSelectedLevel(levelId)}
        onEdit={(level) => { setEditingLevel(level); setLevelDialogOpen(true); }}
      />
    );
  };

  const handleRefreshAll = () => {
    levelsQuery.refetch();
    allSubjectsQuery.refetch();
    curriculumsQuery.refetch();
    programsQuery.refetch();
    if (selectedLevel) gradesQuery.refetch();
    if (selectedGrade) subjectsQuery.refetch();
  };

  const getActions = () => {
    const commonActions = (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="rounded-xl gap-2" />}>
            <Upload className="h-4 w-4" />
            Import
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl w-48">
            <DropdownMenuItem>
              <Link href="/admin/academic/import" className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm">
                <Upload className="h-4 w-4" />
                Buka Halaman Import
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={handleRefreshAll} className="rounded-xl gap-2">
          <RefreshCw className="h-4 w-4" />
          Muat Ulang
        </Button>
      </div>
    );

    if (activeTab === "subjects") {
      return (
        <div className="flex items-center gap-2">
          {commonActions}
          <Button onClick={() => setSubjectDialogOpen(true)} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Mata Pelajaran
          </Button>
        </div>
      );
    }

    if (activeTab === "curriculum") {
      return (
        <div className="flex items-center gap-2">
          {commonActions}
          <Button onClick={() => { setEditingCurriculum(null); setCurriculumDialogOpen(true); }} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kurikulum
          </Button>
        </div>
      );
    }

    if (activeTab === "program") {
      return (
        <div className="flex items-center gap-2">
          {commonActions}
          <Button onClick={() => { setEditingProgram(null); setProgramDialogOpen(true); }} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Program
          </Button>
        </div>
      );
    }

    if (selectedSubject) {
      return commonActions;
    }

    if (selectedGrade) {
      return (
        <div className="flex items-center gap-2">
          {commonActions}
          <Button onClick={() => setSubjectDialogOpen(true)} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Mata Pelajaran
          </Button>
        </div>
      );
    }

    if (selectedLevel) {
      return (
        <div className="flex items-center gap-2">
          {commonActions}
          <Button onClick={() => setGradeDialogOpen(true)} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kelas
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {commonActions}
        <Button onClick={() => setLevelDialogOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jenjang
        </Button>
      </div>
    );
  };

  const isAnyError = levelsQuery.isError || curriculumsQuery.isError || programsQuery.isError || allSubjectsQuery.isError;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Master Akademik"
          description="Kelola hirarki akademik: Jenjang, Kelas, Mata Pelajaran, Kurikulum, Program"
          actions={getActions()}
        />

        {/* Overview KPI Cards */}
        <AcademicStatsOverview
          totalLevels={levelsQuery.data?.length || 0}
          totalSubjects={allSubjectsQuery.data?.length || 0}
          totalCurriculums={curriculumsQuery.data?.length || 0}
          totalPrograms={programsQuery.data?.length || 0}
          isLoading={levelsQuery.isLoading || curriculumsQuery.isLoading || programsQuery.isLoading || allSubjectsQuery.isLoading}
        />

        {/* Global Error Banner */}
        {isAnyError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Terjadi kendala saat memuat data master akademik dari server.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                levelsQuery.refetch();
                allSubjectsQuery.refetch();
                curriculumsQuery.refetch();
                programsQuery.refetch();
              }}
              className="ml-auto rounded-lg"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Tabs & Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="hierarchy" className="rounded-lg">Kelas</TabsTrigger>
            <TabsTrigger value="subjects" className="rounded-lg">Mata Pelajaran</TabsTrigger>
            <TabsTrigger value="curriculum" className="rounded-lg">Kurikulum</TabsTrigger>
            <TabsTrigger value="program" className="rounded-lg">Program</TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy" className="space-y-6 m-0">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/staff" className="text-muted-foreground hover:text-foreground">
                      <Home className="h-3.5 w-3.5" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <button
                      onClick={() => {
                        setSelectedLevel(null);
                        setSelectedGrade(null);
                        setSelectedSubject(null);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      Master Akademik
                    </button>
                  </BreadcrumbItem>
                  {selectedLevelData && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <button
                          onClick={() => {
                            setSelectedGrade(null);
                            setSelectedSubject(null);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selectedLevelData.name}
                        </button>
                      </BreadcrumbItem>
                    </>
                  )}
                  {selectedGradeData && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <button
                          onClick={() => setSelectedSubject(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selectedGradeData.name}
                        </button>
                      </BreadcrumbItem>
                    </>
                  )}
                  {selectedSubjectData && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-foreground font-semibold">{selectedSubjectData.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              {selectedLevel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  Kembali
                </Button>
              )}
            </div>

            {/* Active Selection Filter Bar */}
            <div className="flex items-center gap-2 p-3.5 bg-card rounded-2xl border border-border/60 shadow-xs">
              <Filter className="h-4 w-4 text-muted-foreground ml-1" />
              <span className="text-xs font-semibold text-muted-foreground">Filter:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedLevelData ? (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {selectedLevelData.name}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/70 italic">Semua Jenjang</span>
                )}
                {selectedGradeData && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {selectedGradeData.name}
                  </div>
                )}
                {selectedSubjectData && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                    <BookOpen className="h-3.5 w-3.5" />
                    {selectedSubjectData.name}
                  </div>
                )}
                <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                  className="text-xs px-3 py-1 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-aktif</option>
                </select>
              </div>
            </div>

            {/* Main Hierarchy Content */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              {renderHierarchyContent()}
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="m-0">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <SubjectsTab
          onEdit={(s) => { setEditingSubject({ id: s.id, education_level_id: s.level_id, grade_id: s.grade_id, name: s.name, code: s.code, description: s.description, display_order: s.display_order }); setSubjectDialogOpen(true); }}
                onAdd={() => setSubjectDialogOpen(true)}
                onSelect={handleSubjectSelect}
                filterStatus={filterStatus}
              />
            </div>
          </TabsContent>

          <TabsContent value="curriculum" className="m-0">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <CurriculumsTab
                onEdit={(curr) => {
                  setEditingCurriculum(curr);
                  setCurriculumDialogOpen(true);
                }}
                onAdd={() => { setEditingCurriculum(null); setCurriculumDialogOpen(true); }}
                filterStatus={filterStatus}
              />
            </div>
          </TabsContent>

          <TabsContent value="program" className="m-0">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <ProgramsTab
                onEdit={(prog) => {
                  setEditingProgram(prog);
                  setProgramDialogOpen(true);
                }}
                onAdd={() => { setEditingProgram(null); setProgramDialogOpen(true); }}
                filterStatus={filterStatus}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Dialogs */}
      <LevelFormDialog
        open={levelDialogOpen}
        onClose={() => setLevelDialogOpen(false)}
        onSuccess={() => {
          setLevelDialogOpen(false);
          levelsQuery.refetch();
        }}
        editing={editingLevel}
      />
      <GradeFormDialog
        open={gradeDialogOpen}
        onClose={() => setGradeDialogOpen(false)}
        onSuccess={() => {
          setGradeDialogOpen(false);
          gradesQuery.refetch();
        }}
        editing={editingGrade}
      />
      <SubjectFormDialog
        open={subjectDialogOpen}
        onClose={() => setSubjectDialogOpen(false)}
        onSuccess={() => {
          setSubjectDialogOpen(false);
          subjectsQuery.refetch();
          allSubjectsQuery.refetch();
        }}
        editing={editingSubject}
      />
      <CurriculumFormDialog
        open={curriculumDialogOpen}
        onClose={() => setCurriculumDialogOpen(false)}
        onSuccess={() => {
          setCurriculumDialogOpen(false);
          curriculumsQuery.refetch();
        }}
        editing={editingCurriculum}
      />
      <ProgramFormDialog
        open={programDialogOpen}
        onClose={() => setProgramDialogOpen(false)}
        onSuccess={() => {
          setProgramDialogOpen(false);
          programsQuery.refetch();
        }}
        editing={editingProgram}
      />
    </>
  );
}