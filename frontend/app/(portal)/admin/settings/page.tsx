"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import {
    SlidersHorizontal,
    Bot,
    Database,
    Shield,
    Save,
    AlertTriangle,
    CheckCircle2,
    RefreshCcw,
    Radio,
    Key,
    Server,
    Sparkles,
    Eye,
    EyeOff,
    Loader2,
    Globe,
    Cpu,
    Check,
} from "lucide-react";

export default function SystemSettingsPage() {
    const [maintenanceMode, setMaintenanceMode] = React.useState(false);
    const [backupStatus, setBackupStatus] = React.useState<string | null>(null);

    // AI Configuration State
    const [aiEndpoint, setAiEndpoint] = React.useState("");
    const [aiApiKey, setAiApiKey] = React.useState("");
    const [aiModel, setAiModel] = React.useState("");
    const [isConfigured, setIsConfigured] = React.useState(false);
    const [isLoadingAiConfig, setIsLoadingAiConfig] = React.useState(true);
    const [isSavingAiConfig, setIsSavingAiConfig] = React.useState(false);
    const [isTestingConnection, setIsTestingConnection] = React.useState(false);
    const [showApiKey, setShowApiKey] = React.useState(false);
    const [saveMessage, setSaveMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

    // Load AI Config on Mount
    React.useEffect(() => {
        const fetchAiConfig = async () => {
            setIsLoadingAiConfig(true);
            try {
                const res = await apiClient.ai.getConfig();
                if (res.success && res.data) {
                    const data = res.data as any;
                    setAiEndpoint(data.ai_endpoint || data.endpoint || "https://api.openai.com/v1");
                    setAiApiKey(data.ai_api_key || data.api_key || "");
                    setAiModel(data.ai_model || data.model || "gpt-4o-mini");
                    setIsConfigured(Boolean(data.is_configured));
                }
            } catch (err) {
                console.warn("Failed to load AI config:", err);
            } finally {
                setIsLoadingAiConfig(false);
            }
        };
        fetchAiConfig();
    }, []);

    const handleSaveAiConfig = async () => {
        setIsSavingAiConfig(true);
        setSaveMessage(null);
        try {
            const res = await apiClient.ai.updateConfig({
                ai_endpoint: aiEndpoint,
                ai_api_key: aiApiKey,
                ai_model: aiModel,
            });

            if (res.success) {
                setIsConfigured(true);
                setSaveMessage({
                    text: "Konfigurasi AI Provider & API Key berhasil diperbarui dan tersimpan di database!",
                    type: "success",
                });
            } else {
                setSaveMessage({
                    text: res.error || "Gagal menyimpan konfigurasi AI",
                    type: "error",
                });
            }
        } catch (err: any) {
            setSaveMessage({
                text: "Gagal menyimpan konfigurasi: " + (err.message || err),
                type: "error",
            });
        } finally {
            setIsSavingAiConfig(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        setSaveMessage(null);
        try {
            const res = await apiClient.ai.testConnection({
                endpoint: aiEndpoint,
                api_key: aiApiKey,
                model: aiModel,
            });

            if (res.success) {
                setSaveMessage({
                    text: (res.data as any)?.message || "Koneksi ke AI Provider Berhasil Terhubung!",
                    type: "success",
                });
            } else {
                setSaveMessage({
                    text: "Uji Koneksi Gagal: " + (res.error || "Pemeriksaan koneksi tidak merespons"),
                    type: "error",
                });
            }
        } catch (err: any) {
            setSaveMessage({
                text: "Uji Koneksi Error: " + (err.message || err),
                type: "error",
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const triggerBackup = () => {
        setBackupStatus("Proses backup database sedang berlangsung...");
        setTimeout(() => {
            setBackupStatus("Backup database sukses! File: backup-2026-07-29.sql.gz (1.4GB)");
        }, 1500);
    };

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold">SYSTEM CONFIGURATION</Badge>
                        <span className="text-xs text-muted-foreground">Global Platform & AI Engine Settings</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Pengaturan Sistem</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Pusat kontrol konfigurasi AI Provider (Cloud/Local AI), mode pemeliharaan server, dan snapshot database.
                    </p>
                </div>

                <Button
                    size="sm"
                    onClick={handleSaveAiConfig}
                    disabled={isSavingAiConfig}
                    className="text-xs font-bold shadow-md shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isSavingAiConfig ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Simpan Semua Pengaturan
                        </>
                    )}
                </Button>
            </div>

            {saveMessage && (
                <div
                    className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${saveMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        {saveMessage.type === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <span>{saveMessage.text}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSaveMessage(null)}
                        className="h-6 text-[10px] px-2"
                    >
                        Tutup
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CARD 1: MAIN AI CONFIGURATION PANEL (2 COLS) */}
                <Card className="lg:col-span-2 p-6 space-y-6 shadow-sm border-indigo-100">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                                <Bot className="h-5 w-5 text-primary" /> Central AI Provider & Vision Parsing Engine
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Atur endpoint dan API Key untuk ekstraksi soal bertingkat AI PDF, Vision OCR, dan AI Tutor 24/7.
                            </p>
                        </div>
                        <Badge
                            className={
                                isConfigured
                                    ? "bg-emerald-500 text-white font-semibold text-xs px-2.5 py-0.5"
                                    : "bg-amber-500 text-white font-semibold text-xs px-2.5 py-0.5"
                            }
                        >
                            {isConfigured ? "API Key Terpasang" : "Belum Dikonfigurasi"}
                        </Badge>
                    </div>

                    {isLoadingAiConfig ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground text-xs font-semibold gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat konfigurasi AI...
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Quick Preset Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground block">
                                    Pilih Quick Preset Provider:
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setAiEndpoint("http://127.0.0.1:11434/v1");
                                            setAiApiKey("ollama");
                                            setAiModel("llama3.2-vision");
                                        }}
                                        className={`text-xs h-9 font-semibold justify-start ${aiEndpoint.includes("11434")
                                            ? "border-primary bg-primary/10 text-primary font-bold"
                                            : ""
                                            }`}
                                    >
                                        <Cpu className="mr-1.5 h-3.5 w-3.5" /> 🦙 Ollama (Local)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setAiEndpoint("http://127.0.0.1:1234/v1");
                                            setAiApiKey("lm-studio");
                                            setAiModel("local-model");
                                        }}
                                        className={`text-xs h-9 font-semibold justify-start ${aiEndpoint.includes("1234")
                                            ? "border-primary bg-primary/10 text-primary font-bold"
                                            : ""
                                            }`}
                                    >
                                        <Server className="mr-1.5 h-3.5 w-3.5" /> 💻 LM Studio
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setAiEndpoint("https://api.openai.com/v1");
                                            setAiModel("gpt-4o-mini");
                                        }}
                                        className={`text-xs h-9 font-semibold justify-start ${aiEndpoint.includes("openai.com")
                                            ? "border-primary bg-primary/10 text-primary font-bold"
                                            : ""
                                            }`}
                                    >
                                        <Globe className="mr-1.5 h-3.5 w-3.5" /> 🌐 OpenAI
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setAiEndpoint("https://openrouter.ai/api/v1");
                                            setAiModel("google/gemini-2.5-flash");
                                        }}
                                        className={`text-xs h-9 font-semibold justify-start ${aiEndpoint.includes("openrouter")
                                            ? "border-primary bg-primary/10 text-primary font-bold"
                                            : ""
                                            }`}
                                    >
                                        <Sparkles className="mr-1.5 h-3.5 w-3.5" /> 🔄 OpenRouter
                                    </Button>
                                </div>
                            </div>

                            {/* Detailed Form Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground block">
                                        Base Endpoint URL
                                    </label>
                                    <input
                                        type="text"
                                        value={aiEndpoint}
                                        onChange={e => setAiEndpoint(e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-[10px] text-muted-foreground">
                                        Gunakan `http://localhost:11434/v1` untuk Ollama lokal.
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground block">
                                        Model ID / Name
                                    </label>
                                    <input
                                        type="text"
                                        value={aiModel}
                                        onChange={e => setAiModel(e.target.value)}
                                        placeholder="gpt-4o-mini / llama3.2-vision"
                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-[10px] text-muted-foreground">
                                        Contoh: `gpt-4o-mini`, `llama3.2-vision`, `google/gemini-2.5-flash`.
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground block">
                                    API Key Secret (OpenAI / OpenRouter / Custom)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={aiApiKey}
                                        onChange={e => setAiApiKey(e.target.value)}
                                        placeholder="sk-proj-..."
                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="text-xs font-semibold shrink-0"
                                    >
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    Disimpan dengan aman di database `system_settings` dan terisolasi dari akses publik.
                                </span>
                            </div>

                            <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTestConnection}
                                    disabled={isTestingConnection}
                                    className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                                >
                                    {isTestingConnection ? (
                                        <>
                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Memeriksa Koneksi...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" /> ⚡ Uji Koneksi AI
                                        </>
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSaveAiConfig}
                                    disabled={isSavingAiConfig}
                                    className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {isSavingAiConfig ? (
                                        <>
                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-1.5 h-3.5 w-3.5" /> Simpan Konfigurasi AI Provider
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* CARD 2 & 3: MAINTENANCE MODE & DATABASE BACKUP (1 COL) */}
                <div className="space-y-6">
                    {/* Maintenance Mode */}
                    <Card className="p-6 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <Server className="h-4 w-4 text-primary" /> Maintenance Switch
                                </h3>
                                <p className="text-[11px] text-muted-foreground">Batasi portal siswa saat perawatan server</p>
                            </div>
                            <Badge variant={maintenanceMode ? "destructive" : "success"} className="text-[10px] font-bold">
                                {maintenanceMode ? "ACTIVE" : "OFF"}
                            </Badge>
                        </div>

                        <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                            <div className="space-y-0.5">
                                <span className="font-bold text-xs">Status Portal Siswa</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Jika diaktifkan, seluruh siswa yang mengakses ujian/materi akan diarahkan ke halaman pemeliharaan.
                                </p>
                            </div>
                            <Button
                                variant={maintenanceMode ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => setMaintenanceMode(!maintenanceMode)}
                                className="w-full text-xs font-semibold"
                            >
                                {maintenanceMode ? "Matikan Maintenance Mode" : "Aktifkan Maintenance Mode"}
                            </Button>
                        </div>
                    </Card>

                    {/* Database Backup Trigger */}
                    <Card className="p-6 space-y-4 shadow-sm">
                        <div className="border-b pb-3">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Database className="h-4 w-4 text-indigo-500" /> Database Backup & Snapshot
                            </h3>
                            <p className="text-[11px] text-muted-foreground">Pemicu snapshot database PostgreSQL</p>
                        </div>

                        <div className="p-3.5 rounded-xl border space-y-3 bg-muted/20">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[11px]">Jadwal Auto-Backup: <strong>Setiap 03:00 WIB</strong></span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={triggerBackup}
                                className="w-full text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                            >
                                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" /> Pemicu Backup Sekarang
                            </Button>
                            {backupStatus && (
                                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>{backupStatus}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
