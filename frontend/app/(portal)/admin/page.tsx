"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { useAdminDashboard } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import {
    Users,
    School,
    FileSpreadsheet,
    DollarSign,
    Server,
    Cpu,
    Radio,
    CheckCircle2,
    RefreshCw,
    ArrowUpRight,
    Plus,
    AlertCircle,
    HelpCircle,
    Terminal,
    Database,
    BookOpen,
    Bot,
    Activity,
    Clock,
    Zap,
    HardDrive,
    Layers,
    ExternalLink,
    Play,
    Pause,
    Trash2,
    Search,
    Copy,
    Check,
    Filter,
    BarChart3,
} from "lucide-react";

interface HealthMetric {
    name: string;
    endpoint?: string;
    status: "HEALTHY" | "DEGRADED" | "DOWN";
    latency: string;
    uptime: string;
}

interface SystemActivity {
    id: string;
    title: string;
    user: string;
    type: "EXAM" | "USER" | "CONTENT" | "AI" | "SYSTEM";
    time: string;
    badgeColor: string;
}

interface TerminalLogEntry {
    id: string;
    timestamp: string;
    level: "INFO" | "WARN" | "ERROR" | "DEBUG";
    module: "HTTP_API" | "CBT_ENGINE" | "DATABASE" | "AI_RAG" | "SECURITY";
    message: string;
}

const INITIAL_HEALTH_SERVICES: HealthMetric[] = [
    { name: "REST API Gateway (Go Fiber)", endpoint: "/contents", status: "HEALTHY", latency: "8ms", uptime: "99.99%" },
    { name: "PostgreSQL Primary DB (Supabase)", status: "HEALTHY", latency: "14ms", uptime: "99.98%" },
    { name: "CBT Sync Worker Engine", status: "HEALTHY", latency: "12ms", uptime: "99.95%" },
    { name: "AI Inference Engine (Gemini)", status: "HEALTHY", latency: "290ms", uptime: "99.90%" },
];

const INITIAL_LOGS: TerminalLogEntry[] = [
    { id: "log-1", timestamp: "21:22:01", level: "INFO", module: "HTTP_API", message: "GET /api/v1/contents?type=QUESTION 200 OK - 8ms [ip: 127.0.0.1]" },
    { id: "log-2", timestamp: "21:21:45", level: "INFO", module: "CBT_ENGINE", message: "Answer saved: session_id=sess_8819 question_id=q_402 (offline sync success)" },
    { id: "log-3", timestamp: "21:20:12", level: "INFO", module: "DATABASE", message: "PostgreSQL pool acquired connection #14. Active pool count: 28/100" },
    { id: "log-4", timestamp: "21:18:30", level: "DEBUG", module: "AI_RAG", message: "Embedding context vector matched 4 tokens in Subject: Fisika Chapter: Mechanics" },
    { id: "log-5", timestamp: "21:15:00", level: "WARN", module: "SECURITY", message: "Auth Bearer token refresh requested for user_id=usr_940af273" },
];

export default function AdminDashboardPage() {
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [lastSyncTime, setLastSyncTime] = React.useState<string>("");
    const [activeModal, setActiveModal] = React.useState<"BACKUP" | "QUICK_USER" | "RESET_TOKEN" | "PURGE_CACHE" | "RELOAD_AI" | null>(null);
    const [modalFeedback, setModalFeedback] = React.useState<string | null>(null);

    // Time range filter
    const [timeRange, setTimeRange] = React.useState<"TODAY" | "7DAYS" | "30DAYS">("TODAY");

    // Interactive Traffic Chart Tab
    const [chartMetric, setChartMetric] = React.useState<"EXAMS" | "TRAFFIC" | "LATENCY">("EXAMS");

    // Interactive Terminal Console State
    const [logs, setLogs] = React.useState<TerminalLogEntry[]>(INITIAL_LOGS);
    const [selectedLogModule, setSelectedLogModule] = React.useState<string>("ALL");
    const [logSearch, setLogSearch] = React.useState<string>("");
    const [isStreamingLogs, setIsStreamingLogs] = React.useState<boolean>(true);
    const [copiedLogs, setCopiedLogs] = React.useState<boolean>(false);

    // Dynamic Live Health Metrics State
    const [healthServices, setHealthServices] = React.useState<HealthMetric[]>(INITIAL_HEALTH_SERVICES);
    const [isPinging, setIsPinging] = React.useState(false);

    // TanStack hooks
    const { data: user } = useAuth() as any;
    const { data: dashData, isLoading: dashLoading, refetch: refetchDashboard } = useAdminDashboard() as any;

    // Simulated log streaming interval
    React.useEffect(() => {
        if (!isStreamingLogs) return;
        const timer = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const modules: Array<TerminalLogEntry["module"]> = ["HTTP_API", "CBT_ENGINE", "DATABASE", "AI_RAG", "SECURITY"];
            const levels: Array<TerminalLogEntry["level"]> = ["INFO", "INFO", "INFO", "DEBUG", "WARN"];
            const randomMod = modules[Math.floor(Math.random() * modules.length)] || "HTTP_API";
            const randomLevel = levels[Math.floor(Math.random() * levels.length)] || "INFO";

            const sampleMsgs: Record<TerminalLogEntry["module"], string> = {
                HTTP_API: `GET /api/v1/contents/subtype 200 OK - ${Math.floor(Math.random() * 15 + 4)}ms`,
                CBT_ENGINE: `Session heartbeat check: 42 active candidates synchronized`,
                DATABASE: `Execute query: SELECT * FROM contents WHERE status = 'PUBLISHED'`,
                AI_RAG: `Gemini 1.5 Flash stream generation chunked: 240 tokens/sec`,
                SECURITY: `Token verification passed for role=ADMIN`,
            };

            const newLog: TerminalLogEntry = {
                id: `log-${Date.now()}`,
                timestamp: timeStr,
                level: randomLevel,
                module: randomMod,
                message: sampleMsgs[randomMod],
            };

            setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
        }, 6000);

        return () => clearInterval(timer);
    }, [isStreamingLogs]);

    // Interactive Ping Test for REST API Gateway
    const handlePingLiveApi = async () => {
        setIsPinging(true);
        const startTime = performance.now();
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
            const res = await fetch(`${baseUrl}/contents?limit=1`);
            const endTime = performance.now();
            const latencyMs = Math.round(endTime - startTime);

            setHealthServices((prev) =>
                prev.map((srv) =>
                    srv.name.includes("Go Fiber")
                        ? {
                            ...srv,
                            status: res.ok ? "HEALTHY" : "DEGRADED",
                            latency: `${latencyMs}ms`,
                        }
                        : srv
                )
            );
        } catch (err) {
            setHealthServices((prev) =>
                prev.map((srv) =>
                    srv.name.includes("Go Fiber")
                        ? { ...srv, status: "DEGRADED", latency: "Offline / CORS" }
                        : srv
                )
            );
        } finally {
            setIsPinging(false);
        }
    };

    const handleModalSubmit = (actionName: string) => {
        setModalFeedback(`${actionName} berhasil diproses oleh sistem!`);
        setTimeout(() => {
            setModalFeedback(null);
            setActiveModal(null);
        }, 1200);
    };

    const filteredLogs = logs.filter((l) => {
        const matchesModule = selectedLogModule === "ALL" || l.module === selectedLogModule;
        const matchesSearch = l.message.toLowerCase().includes(logSearch.toLowerCase()) || l.module.toLowerCase().includes(logSearch.toLowerCase());
        return matchesModule && matchesSearch;
    });

    const handleCopyLogs = () => {
        const text = logs.map((l) => `[${l.timestamp}] [${l.level}] [${l.module}] ${l.message}`).join("\n");
        navigator.clipboard.writeText(text);
        setCopiedLogs(true);
        setTimeout(() => setCopiedLogs(false), 2000);
    };

    return (
        <div className="space-y-8 p-4 sm:p-6 pb-16 bg-slate-50/50">
            {/* Top Command Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-extrabold tracking-wider bg-blue-600 text-white">
                            COMMAND CENTER
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Telemetry
                            {lastSyncTime && <span className="font-mono">({lastSyncTime})</span>}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                        Admin Command Center
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pemantauan real-time infrastruktur Go Fiber, PostgreSQL DB, statistik CBT engine, dan API explorer.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Time Range Filter */}
                    <div className="bg-slate-200/60 p-1 rounded-xl flex items-center gap-1">
                        {(["TODAY", "7DAYS", "30DAYS"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${timeRange === r
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                {r === "TODAY" ? "Hari Ini" : r === "7DAYS" ? "7 Hari" : "30 Hari"}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchDashboard()}
                        disabled={dashLoading}
                        className="text-xs font-semibold bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                    >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${dashLoading ? "animate-spin text-blue-600" : ""}`} />
                        {dashLoading ? "Syncing..." : "Refresh"}
                    </Button>

                    <Link href="/admin/docs">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs font-semibold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-sm"
                        >
                            <Terminal className="h-3.5 w-3.5 text-blue-600" /> API Explorer
                        </Button>
                    </Link>

                    <Button
                        size="sm"
                        onClick={() => setActiveModal("QUICK_USER")}
                        className="text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="mr-1.5 h-4 w-4" /> Registrasi Admin
                    </Button>
                </div>
            </div>

            {/* Global KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 relative overflow-hidden bg-white border-slate-200 shadow-sm hover:border-blue-500/40 transition-all group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Total Pengguna DB</span>
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black tracking-tight text-slate-900">
                            {dashLoading ? "..." : `${dashData?.totalUsers ?? 0} User`}
                        </div>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3.5 w-3.5" /> Terhubung Supabase PostgreSQL
                        </span>
                    </div>
                </Card>

                <Card className="p-5 relative overflow-hidden bg-white border-slate-200 shadow-sm hover:border-emerald-500/40 transition-all group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Sekolah Mitra Active</span>
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <School className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black tracking-tight text-slate-900">
                            {dashLoading ? "..." : `${dashData?.totalSchools ?? 0} Sekolah`}
                        </div>
                        <span className="text-xs text-slate-500 font-medium mt-1 block">
                            Kuota Kuat Terintegrasi
                        </span>
                    </div>
                </Card>

                <Card className="p-5 relative overflow-hidden bg-white border-slate-200 shadow-sm hover:border-amber-500/40 transition-all group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Sesi Ujian CBT Aktif</span>
                        <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black tracking-tight text-amber-600 flex items-center gap-2">
                            <Radio className="h-5 w-5 animate-pulse" /> {dashLoading ? "..." : `${dashData?.activeExamSessions ?? 0} Peserta`}
                        </div>
                        <span className="text-xs text-slate-500 font-medium mt-1 block">
                            {dashData?.totalExams ?? 0} Paket Ujian Siap Digunakan
                        </span>
                    </div>
                </Card>

                <Card className="p-5 relative overflow-hidden bg-white border-slate-200 shadow-sm hover:border-indigo-500/40 transition-all group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Total Bank Soal (QB)</span>
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            <HelpCircle className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black tracking-tight text-slate-900">
                            {dashLoading ? "..." : `${dashData?.totalQuestions ?? 0} Soal`}
                        </div>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {dashData?.approvedQuestions ?? 0} Soal Terverifikasi
                        </span>
                    </div>
                </Card>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" /> Quick Launch & Modul Administrasi
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { title: "Master Data", icon: Database, href: "/admin/master-data", badge: "Akademik", color: "text-blue-600 bg-blue-50" },
                        { title: "User & Role", icon: Users, href: "/admin/users", badge: "Access", color: "text-purple-600 bg-purple-50" },
                        { title: "Bank Soal", icon: HelpCircle, href: "/admin/question-bank", badge: "FSM Workflow", color: "text-indigo-600 bg-indigo-50" },
                        { title: "CBT Exam Engine", icon: FileSpreadsheet, href: "/admin/cbt", badge: "Runtime", color: "text-amber-600 bg-amber-50" },
                        { title: "API Explorer", icon: Terminal, href: "/admin/docs", badge: "OpenAPI", color: "text-emerald-600 bg-emerald-50" },
                        { title: "AI Tutor Companion", icon: Bot, href: "/admin/ai-tutor", badge: "RAG Model", color: "text-rose-600 bg-rose-50" },
                    ].map((item, idx) => {
                        const ItemIcon = item.icon;
                        return (
                            <Link key={idx} href={item.href}>
                                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all flex flex-col justify-between h-full group">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-2 rounded-xl ${item.color}`}>
                                            <ItemIcon className="w-4 h-4" />
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="mt-3">
                                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </h4>
                                        <span className="text-[10px] text-slate-400">{item.badge}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Interactive Traffic Area Chart & System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Visualizer Chart */}
                <Card className="lg:col-span-2 p-5 sm:p-6 space-y-4 bg-white border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="font-bold text-base flex items-center gap-2 text-slate-900">
                                <BarChart3 className="h-4.5 w-4.5 text-blue-600" /> Visualisasi Performa & Traffic CBT
                            </h3>
                            <p className="text-xs text-slate-500">Tren peserta ujian bersamaan dan throughput API server</p>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                            <button
                                onClick={() => setChartMetric("EXAMS")}
                                className={`px-2.5 py-1 rounded-lg transition-all ${chartMetric === "EXAMS"
                                        ? "bg-white text-blue-600 shadow-sm font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Peserta Ujian
                            </button>
                            <button
                                onClick={() => setChartMetric("TRAFFIC")}
                                className={`px-2.5 py-1 rounded-lg transition-all ${chartMetric === "TRAFFIC"
                                        ? "bg-white text-blue-600 shadow-sm font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                API Traffic
                            </button>
                            <button
                                onClick={() => setChartMetric("LATENCY")}
                                className={`px-2.5 py-1 rounded-lg transition-all ${chartMetric === "LATENCY"
                                        ? "bg-white text-blue-600 shadow-sm font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Latency (ms)
                            </button>
                        </div>
                    </div>

                    {/* SVG Chart */}
                    <div className="h-56 w-full pt-2">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                            <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            {/* Grid lines */}
                            <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" />

                            {/* Path Area */}
                            <path
                                d={
                                    chartMetric === "EXAMS"
                                        ? "M 0 130 Q 80 110, 160 60 T 320 80 T 500 30 L 500 160 L 0 160 Z"
                                        : chartMetric === "TRAFFIC"
                                            ? "M 0 140 Q 100 80, 200 40 T 350 70 T 500 20 L 500 160 L 0 160 Z"
                                            : "M 0 90 Q 120 100, 240 70 T 360 85 T 500 65 L 500 160 L 0 160 Z"
                                }
                                fill="url(#chartGrad)"
                            />
                            {/* Stroke Line */}
                            <path
                                d={
                                    chartMetric === "EXAMS"
                                        ? "M 0 130 Q 80 110, 160 60 T 320 80 T 500 30"
                                        : chartMetric === "TRAFFIC"
                                            ? "M 0 140 Q 100 80, 200 40 T 350 70 T 500 20"
                                            : "M 0 90 Q 120 100, 240 70 T 360 85 T 500 65"
                                }
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            {/* Points */}
                            <circle cx="160" cy={chartMetric === "EXAMS" ? 60 : chartMetric === "TRAFFIC" ? 40 : 70} r="4" className="fill-white stroke-blue-600 stroke-2" />
                            <circle cx="320" cy={chartMetric === "EXAMS" ? 80 : chartMetric === "TRAFFIC" ? 70 : 85} r="4" className="fill-white stroke-blue-600 stroke-2" />
                            <circle cx="500" cy={chartMetric === "EXAMS" ? 30 : chartMetric === "TRAFFIC" ? 20 : 65} r="4" className="fill-white stroke-blue-600 stroke-2" />
                        </svg>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                        <span>08:00 WIB</span>
                        <span>12:00 WIB</span>
                        <span>16:00 WIB</span>
                        <span>20:00 WIB (Peak)</span>
                    </div>
                </Card>

                {/* Health Overview & Quick Controls */}
                <Card className="p-5 sm:p-6 space-y-4 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-bold text-base flex items-center gap-2 text-slate-900">
                                    <Server className="h-4.5 w-4.5 text-blue-600" /> Go Backend Health
                                </h3>
                                <p className="text-xs text-slate-500">API Gateway `http://localhost:8080`</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePingLiveApi}
                                disabled={isPinging}
                                className="text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50"
                            >
                                <Zap className={`w-3.5 h-3.5 mr-1 text-amber-500 ${isPinging ? "animate-bounce" : ""}`} />
                                {isPinging ? "Ping..." : "Ping API"}
                            </Button>
                        </div>

                        <div className="space-y-2 mt-4">
                            {healthServices.map((srv, idx) => (
                                <div
                                    key={idx}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                                >
                                    <span className="font-bold text-slate-800">{srv.name}</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] font-mono font-bold ${srv.status === "HEALTHY"
                                                ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                                                : "text-amber-700 border-amber-300 bg-amber-50"
                                            }`}
                                    >
                                        {srv.latency}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-xs font-bold text-slate-400 block">System Maintenance Hub</span>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveModal("PURGE_CACHE")}
                                className="text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50"
                            >
                                Purge Redis Cache
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveModal("RELOAD_AI")}
                                className="text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50"
                            >
                                Reload AI RAG
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Interactive Live Terminal Log Console */}
            <Card className="p-5 sm:p-6 bg-white text-slate-900 border-slate-200 shadow-sm rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                            <Terminal className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-900">Live Terminal Logs Console</h3>
                                <span className={`w-2 h-2 rounded-full ${isStreamingLogs ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                            </div>
                            <p className="text-xs text-slate-500">Stream log sistem dari REST API Gateway, CBT Worker, DB Pool, & AI Tutor</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsStreamingLogs(!isStreamingLogs)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${isStreamingLogs
                                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                }`}
                        >
                            {isStreamingLogs ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            {isStreamingLogs ? "Pause Stream" : "Resume Stream"}
                        </button>

                        <button
                            onClick={handleCopyLogs}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all"
                        >
                            {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy Logs
                        </button>

                        <button
                            onClick={() => setLogs([])}
                            className="p-1.5 rounded-lg text-xs bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-all"
                            title="Clear Console"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Console Controls & Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                        {(["ALL", "HTTP_API", "CBT_ENGINE", "DATABASE", "AI_RAG", "SECURITY"] as const).map((mod) => (
                            <button
                                key={mod}
                                onClick={() => setSelectedLogModule(mod)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${selectedLogModule === mod
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                                    }`}
                            >
                                {mod}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search log stream..."
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Terminal Body Output */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs max-h-72 overflow-y-auto space-y-2 leading-relaxed">
                    {filteredLogs.length === 0 ? (
                        <div className="text-slate-400 text-center py-6">Tidak ada log ditemukan untuk filter ini.</div>
                    ) : (
                        filteredLogs.map((l) => (
                            <div key={l.id} className="flex items-start gap-2 hover:bg-slate-200/50 p-1.5 rounded transition-colors">
                                <span className="text-slate-400 text-[11px] shrink-0 font-medium">{l.timestamp}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${l.level === "ERROR"
                                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                                            : l.level === "WARN"
                                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                                : l.level === "DEBUG"
                                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        }`}
                                >
                                    {l.level}
                                </span>
                                <span className="text-blue-600 text-[11px] font-bold shrink-0">[{l.module}]</span>
                                <span className="text-slate-800 break-all">{l.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Modals */}
            <AdminActionModal
                isOpen={activeModal === "BACKUP"}
                onClose={() => setActiveModal(null)}
                title="Pemicu Snapshot Backup Database"
                description="Buat cadangan database PostgreSQL secara manual."
                onSubmit={() => handleModalSubmit("Backup Database")}
                submitLabel="Jalankan Backup Manual"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p>Proses backup akan mengompres file data dan mengunggahnya ke Cloud Storage aman S3.</p>
                        <div className="p-3 rounded-xl bg-slate-100 border font-mono text-[11px]">
                            Target: backup-2026-07-27-manual.sql.gz
                        </div>
                    </div>
                )}
            </AdminActionModal>

            <AdminActionModal
                isOpen={activeModal === "QUICK_USER"}
                onClose={() => setActiveModal(null)}
                title="Registrasi Administrator Baru"
                description="Tambahkan kredensial akun staff atau supervisor admin baru."
                onSubmit={() => handleModalSubmit("Registrasi User Admin")}
                submitLabel="Buat Akun Admin"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                placeholder="Masukkan nama..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Email Instansi</label>
                            <input
                                type="email"
                                placeholder="admin@yakinlulus.id"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-background"
                            />
                        </div>
                    </div>
                )}
            </AdminActionModal>

            <AdminActionModal
                isOpen={activeModal === "RESET_TOKEN"}
                onClose={() => setActiveModal(null)}
                title="Konfirmasi Emergency Reset Token CBT"
                description="Kosongkan kuncian ruang ujian dan atur ulang token proteksi peserta."
                onSubmit={() => handleModalSubmit("Force Reset Token CBT")}
                submitLabel="Konfirmasi Reset Darurat"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                        Tindakan ini akan mengizinkan seluruh peserta sesi ujian aktif yang terputus untuk melakukan login ulang dengan token baru.
                    </div>
                )}
            </AdminActionModal>

            <AdminActionModal
                isOpen={activeModal === "PURGE_CACHE"}
                onClose={() => setActiveModal(null)}
                title="Purge Redis Cache In-Memory"
                description="Hapus seluruh cache kueri yang tersimpan di memori Redis."
                onSubmit={() => handleModalSubmit("Purge Redis Cache")}
                submitLabel="Purge Cache Sekarang"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <p className="text-xs text-slate-600">
                        Pembersihan cache akan memaksa server untuk mengambil data langsung dari PostgreSQL Supabase pada permintaan berikutnya.
                    </p>
                )}
            </AdminActionModal>

            <AdminActionModal
                isOpen={activeModal === "RELOAD_AI"}
                onClose={() => setActiveModal(null)}
                title="Reload AI RAG Vector Embeddings"
                description="Memuat ulang indeks vektor pengetahuan AI Tutor."
                onSubmit={() => handleModalSubmit("Reload AI Vectors")}
                submitLabel="Muat Ulang Vektor AI"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <p className="text-xs text-slate-600">
                        Memperbarui basis pengetahuan RAG dengan dokumen materi pembelajaran dan bank soal terbaru.
                    </p>
                )}
            </AdminActionModal>
        </div>
    );
}
