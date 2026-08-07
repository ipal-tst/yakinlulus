"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { GraduationCap, Filter, Plus, ChevronRight, Home, AlertCircle, BookOpen } from "lucide-react";
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
import type { Curriculum, Program } from "@/types/academic-master";
import { LevelTable } from "@/components/table/LevelTable";
import { GradeTable } from "@/components/table/GradeTable";
import { SubjectTable } from "@/components/table/SubjectTable";
import { CurriculumTable } from "@/components/table/CurriculumTable";
import { ProgramTable } from "@/components/table/ProgramTable";
import BabTable from "./bab/BabTable";
import { AcademicStatsOverview } from "@/components/admin/academic/AcademicStatsOverview";
import { LevelFormDialog } from "./forms/LevelFormDialog";
import { GradeFormDialog } from "./forms/GradeFormDialog";
import { SubjectFormDialog } from "./forms/SubjectFormDialog";
import { CurriculumFormDialog } from "./forms/CurriculumFormDialog";
import { ProgramFormDialog } from "./forms/ProgramFormDialog";

export default function AdminAcademicPage() {
  const [activeTab, setActiveTab] = useState("hierarchy");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [editingSubject, setEditingSubject] = useState<any>(null);
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
    queryKey: ["academic-subjects", selectedLevel, selectedGrade],
    queryFn: () => selectedLevel && selectedGrade
      ? academicMasterService.getSubjects(selectedLevel, selectedGrade)
      : Promise.resolve([]),
    enabled: !!selectedLevel && !!selectedGrade,
  });

  // Global subjects query for Mapel tab and KPI overview
  const allSubjectsQuery = useQuery({
    queryKey: ["academic-all-subjects"],
    queryFn: () => academicMasterService.getSubjects(),
  });

  const curriculumsQuery = useQuery({
    queryKey: ["academic-curriculums"],
    queryFn: academicMasterService.getCurriculums,
  });

  const programsQuery = useQuery({
    queryKey: ["academic-programs"],
    queryFn: academicMasterService.getPrograms,
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
    // If selecting from global subject tab, switch active tab to hierarchy view
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

  const renderContent = () => {
    if (selectedSubject) {
      return <BabTable subjectId={selectedSubject} />;
    }

    if (selectedGrade) {
      return (
        <SubjectTable
          subjects={subjectsQuery.data || []}
          onSelect={handleSubjectSelect}
          onEdit={(subject) => { setEditingSubject(subject); setSubjectDialogOpen(true); }}
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

  const getActions = () => {
    if (activeTab === "subjects") {
      return (
        <Button onClick={() => setSubjectDialogOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Mata Pelajaran
        </Button>
      );
    }

    if (activeTab === "curriculum") {
      return (
        <Button onClick={() => { setEditingCurriculum(null); setCurriculumDialogOpen(true); }} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kurikulum
        </Button>
      );
    }

    if (activeTab === "program") {
      return (
        <Button onClick={() => { setEditingProgram(null); setProgramDialogOpen(true); }} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Program
        </Button>
      );
    }

    if (selectedSubject) {
      return null;
    }

    if (selectedGrade) {
      return (
        <Button onClick={() => setSubjectDialogOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Mata Pelajaran
        </Button>
      );
    }

    if (selectedLevel) {
      return (
        <Button onClick={() => setGradeDialogOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kelas
        </Button>
      );
    }

    return (
      <Button onClick={() => setLevelDialogOpen(true)} className="rounded-xl">
        <Plus className="mr-2 h-4 w-4" />
        Tambah Jenjang
      </Button>
    );
  };

  const isAnyError = levelsQuery.isError || curriculumsQuery.isError || programsQuery.isError || allSubjectsQuery.isError;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Master Akademik"
          description="Kelola hirarki akademik: Jenjang → Kelas → Mata Pelajaran → Bab → Topik → CP/KD"
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
            <TabsTrigger value="hierarchy" className="rounded-lg">Jenjang &amp; Hirarki</TabsTrigger>
            <TabsTrigger value="subjects" className="rounded-lg">Mata Pelajaran (Mapel)</TabsTrigger>
            <TabsTrigger value="curriculum" className="rounded-lg">Kurikulum</TabsTrigger>
            <TabsTrigger value="program" className="rounded-lg">Program Belajar</TabsTrigger>
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
              <span className="text-xs font-semibold text-muted-foreground">Hirarki Terpilih:</span>
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
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold">
                    {selectedGradeData.name}
                  </div>
                )}
                {selectedSubjectData && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                    <BookOpen className="h-3.5 w-3.5" />
                    {selectedSubjectData.name}
                  </div>
                )}
              </div>
            </div>

            {/* Main Hierarchy Content */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              {renderContent()}
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="m-0">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <SubjectTable
                subjects={allSubjectsQuery.data || []}
                onSelect={handleSubjectSelect}
                onEdit={(subject) => { setEditingSubject(subject); setSubjectDialogOpen(true); }}
                selectedSubject={selectedSubject}
              />
            </div>
          </TabsContent>

          <TabsContent value="curriculum" className="m-0">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <CurriculumTable
                curriculums={curriculumsQuery.data || []}
                onEdit={(curr) => {
                  setEditingCurriculum(curr);
                  setCurriculumDialogOpen(true);
                }}
                onDelete={(curr) => academicMasterService.deleteCurriculum(curr.id).then(() => curriculumsQuery.refetch())}
              />
            </div>
          </TabsContent>

          <TabsContent value="program" className="m-0">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <ProgramTable
                programs={programsQuery.data || []}
                onEdit={(prog) => {
                  setEditingProgram(prog);
                  setProgramDialogOpen(true);
                }}
                onDelete={(prog) => academicMasterService.deleteProgram(prog.id).then(() => programsQuery.refetch())}
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
      />
      <GradeFormDialog
        open={gradeDialogOpen}
        onClose={() => setGradeDialogOpen(false)}
        onSuccess={() => {
          setGradeDialogOpen(false);
          gradesQuery.refetch();
        }}
      />
      <SubjectFormDialog
        open={subjectDialogOpen}
        onClose={() => setSubjectDialogOpen(false)}
        onSuccess={() => {
          setSubjectDialogOpen(false);
          subjectsQuery.refetch();
          allSubjectsQuery.refetch();
        }}
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
    </AppShell>
  );
}