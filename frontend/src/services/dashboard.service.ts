import { api } from "@/lib/api";
import { SiswaDashboard } from "@/types/admin";
import { GuruDashboard, AdminDashboard } from "@/types/admin";
import {
    DashboardStudent,
    StudentTargetComparison,
    SubjectMasteryResponse,
    SubjectProgressResponse,
    WeeklyExam,
    StudentStreak,
    StudentDashboardConfig,
} from "@/types/siswa";

export const dashboardService = {
    async getStudentDashboard(): Promise<SiswaDashboard> {
        return api<SiswaDashboard>("/dashboard/student", {});
    },

    async getStudentDashboardV2(): Promise<DashboardStudent> {
        return api<DashboardStudent>("/dashboard/student", {});
    },

    async getTeacherDashboard(): Promise<GuruDashboard> {
        return api<GuruDashboard>("/dashboard/teacher", {});
    },

    async getAdminDashboard(): Promise<AdminDashboard> {
        return api<AdminDashboard>("/dashboard/admin", {});
    },

    // [KONTRAK BARU] Widgets — GET /dashboard/student/*
    async getStudentTarget(): Promise<StudentTargetComparison> {
        return api<StudentTargetComparison>("/dashboard/student/target");
    },

    async getSubjectMastery(): Promise<SubjectMasteryResponse> {
        return api<SubjectMasteryResponse>("/dashboard/student/subject-mastery");
    },

    async getSubjectProgress(): Promise<SubjectProgressResponse> {
        return api<SubjectProgressResponse>("/dashboard/student/subject-progress");
    },

    async getWeeklyExam(): Promise<WeeklyExam> {
        return api<WeeklyExam>("/dashboard/student/weekly-exam");
    },

    async getStudentStreak(): Promise<StudentStreak> {
        return api<StudentStreak>("/dashboard/student/streak");
    },

    // [KONTRAK BARU] Config — GET /config/student-dashboard
    async getStudentDashboardConfig(): Promise<StudentDashboardConfig> {
        return api<StudentDashboardConfig>("/config/student-dashboard");
    },
};