export const APP_CONFIG = {
    name: "YakinLulus.id",
    description: "Platform EdTech & CBT Offline-First Generasi Baru di Indonesia",
    version: "1.0.0-PROD",
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
    routes: {
        home: "/",
        login: "/login",
        register: "/register",
        studentDashboard: "/student",
        teacherDashboard: "/teacher",
        adminDashboard: "/admin",
        cbtExam: (examId: string) => `/exam/${examId}`,
    },
} as const;
