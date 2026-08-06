import { api } from "@/lib/api";
import { SiswaDashboard, GuruDashboard, AdminDashboard } from "@/types/admin";

export const dashboardService = {
    async getStudentDashboard(): Promise<SiswaDashboard> {
        return api<SiswaDashboard>("/dashboard/student", {});
    },

    async getTeacherDashboard(): Promise<GuruDashboard> {
        return api<GuruDashboard>("/dashboard/teacher", {});
    },

    async getAdminDashboard(): Promise<AdminDashboard> {
        return api<AdminDashboard>("/dashboard/admin", {});
    },
};