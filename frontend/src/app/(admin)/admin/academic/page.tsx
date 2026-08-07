"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { GraduationCap, Filter, Plus, ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { academicMasterService } from "@/services/academic-master.service";
import type { EducationLevel, Grade, Subject } from "@/types/academic-master";
import { LevelTable } from "@/components/table/LevelTable";
import { GradeTable } from "@/components/table/GradeTable";
import { SubjectTable } from "@/components/table/SubjectTable";
import BabTable from "./bab/BabTable";
import { LevelFormDialog } from "./forms/LevelFormDialog";
import { GradeFormDialog } from "./forms/GradeFormDialog";
import { SubjectFormDialog } from "./forms/SubjectFormDialog";

export default function AdminAcademicPage() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Form dialog states
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

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

  const selectedLevelData = selectedLevel ? levelsQuery.data?.find(l => l.id === selectedLevel) : null;
  const selectedGradeData = selectedGrade ? gradesQuery.data?.find(g => g.id === selectedGrade) : null;
  const selectedSubjectData = selectedSubject ? subjectsQuery.data?.find(s => s.id === selectedSubject) : null;

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    setSelectedGrade(null);
    setSelectedSubject(null);
  };

  const handleGradeSelect = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedSubject(null);
  };

  const handleSubjectSelect = (subjectId: string) => {
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
          selectedSubject={selectedSubject}
        />
      );
    }

    if (selectedLevel) {
      return (
        <GradeTable
          grades={gradesQuery.data?.map(g => ({ ...g, alias: g.alias ?? null })) || []}
          onSelect={handleGradeSelect}
          selectedGrade={selectedGrade}
        />
      );
    }

    return (
      <LevelTable
        levels={levelsQuery.data || []}
        onToggleStatus={() => {}}
        onDelete={() => {}}
      />
    );
  };

  const getActions = () => {
    if (selectedSubject) {
      return null; // Bab actions handled in BabTable
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

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Master Akademik"
          description="Kelola hierarki akademik: Jenjang → Kelas → Mata Pelajaran → Bab → Topik"
          actions={getActions()}
        />

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
                <BreadcrumbPage className="text-foreground">Master Akademik</BreadcrumbPage>
              </BreadcrumbItem>
              {selectedLevelData && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <button
                      onClick={() => setSelectedLevel(null)}
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
                      onClick={() => setSelectedGrade(null)}
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
                    <button
                      onClick={() => setSelectedSubject(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedSubjectData.name}
                    </button>
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
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              Kembali
            </Button>
          )}
        </div>

        {/* Filter Bar - Show current selection */}
        <div className="flex items-center gap-2 p-4 bg-card rounded-xl border border-border/50">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedLevelData && (
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                <GraduationCap className="h-3.5 w-3.5" />
                {selectedLevelData.name}
              </div>
            )}
            {selectedGradeData && (
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-sm font-medium">
                {selectedGradeData.name}
              </div>
            )}
            {selectedSubjectData && (
              <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-sm font-medium">
                {selectedSubjectData.name}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          {renderContent()}
        </div>
      </div>

      {/* Form Dialogs */}
      <LevelFormDialog
        open={levelDialogOpen}
        onClose={() => setLevelDialogOpen(false)}
        onSuccess={() => setLevelDialogOpen(false)}
      />
      <GradeFormDialog
        open={gradeDialogOpen}
        onClose={() => setGradeDialogOpen(false)}
        onSuccess={() => setGradeDialogOpen(false)}
      />
      <SubjectFormDialog
        open={subjectDialogOpen}
        onClose={() => setSubjectDialogOpen(false)}
        onSuccess={() => setSubjectDialogOpen(false)}
      />
    </AppShell>
  );
}