"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { academicMasterService } from "@/services/academic-master.service"
import type { EducationLevel, Grade, Subject } from "@/types/academic-master"

interface AcademicFilterBarProps {
  onLevelChange?: (levelId: string) => void
  onGradeChange?: (gradeId: string) => void
  onSubjectChange?: (subjectId: string) => void
}

export default function AcademicFilterBar({ onLevelChange, onGradeChange, onSubjectChange }: AcademicFilterBarProps) {
  const [levels, setLevels] = React.useState<EducationLevel[]>([])
  const [grades, setGrades] = React.useState<Grade[]>([])
  const [subjects, setSubjects] = React.useState<Subject[]>([])
  const [selectedLevel, setSelectedLevel] = React.useState<string>("")
  const [selectedGrade, setSelectedGrade] = React.useState<string>("")
  const [selectedSubject, setSelectedSubject] = React.useState<string>("")

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const levelsData = await academicMasterService.getLevels()
        setLevels(levelsData)
      } catch (error) {
        console.error("Failed to fetch levels:", error)
      }
    }
    fetchData()
  }, [])

  React.useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedLevel) {
        setGrades([])
        return
      }
      try {
        const gradesData = await academicMasterService.getGrades(selectedLevel)
        setGrades(gradesData)
        setSelectedGrade("")
        setSelectedSubject("")
      } catch (error) {
        console.error("Failed to fetch grades:", error)
      }
    }
    fetchGrades()
  }, [selectedLevel])

  React.useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedLevel || !selectedGrade) {
        setSubjects([])
        return
      }
      try {
        const subjectsData = await academicMasterService.getSubjects(selectedLevel, selectedGrade)
        setSubjects(subjectsData)
        setSelectedSubject("")
      } catch (error) {
        console.error("Failed to fetch subjects:", error)
      }
    }
    fetchSubjects()
  }, [selectedLevel, selectedGrade])

  const handleLevelChange = (value: string | null) => {
    const v = value ?? ""
    setSelectedLevel(v)
    onLevelChange?.(v)
  }

  const handleGradeChange = (value: string | null) => {
    const v = value ?? ""
    setSelectedGrade(v)
    onGradeChange?.(v)
  }

  const handleSubjectChange = (value: string | null) => {
    const v = value ?? ""
    setSelectedSubject(v)
    onSubjectChange?.(v)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Select value={selectedLevel || null} onValueChange={handleLevelChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Jenjang" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Jenjang</SelectLabel>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <PlusIcon className="size-4" />
        </Button>
      </div>

      <Select
        value={selectedGrade || null}
        onValueChange={handleGradeChange}
        disabled={!selectedLevel}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pilih Kelas" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Kelas</SelectLabel>
            {grades.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!selectedLevel}>
        <PlusIcon className="size-4" />
      </Button>

      <Select
        value={selectedSubject || null}
        onValueChange={handleSubjectChange}
        disabled={!selectedGrade}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pilih Mapel" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Mapel</SelectLabel>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!selectedGrade}>
        <PlusIcon className="size-4" />
      </Button>
    </div>
  )
}
