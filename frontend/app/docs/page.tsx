"use client";

import React, { useState, useEffect } from "react";
import {
    Code,
    Play,
    Key,
    Search,
    ExternalLink,
    Copy,
    Check,
    Terminal,
    Server,
    ShieldAlert,
    BookOpen,
    Layers,
    RefreshCw,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { API_ENDPOINTS, API_TAGS, OPENAPI_SPEC_INFO, ApiEndpoint } from "@/lib/openapi-parser";

export default function ApiDocsPage() {
    const [selectedTag, setSelectedTag] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [token, setToken] = useState<string>("");
    const [viewMode, setViewMode] = useState<"EXPLORER" | "SWAGGER" | "SPEC">("EXPLORER");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Interactive runner state
    const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({});
    const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
    const [responses, setResponses] = useState<Record<string, { status: number; data: any; duration: number; error?: string }>>({});
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedToken = localStorage.getItem("yl_access_token") || "";
            setToken(savedToken);
        }
    }, []);

    const handleSaveToken = (newToken: string) => {
        setToken(newToken);
        if (typeof window !== "undefined") {
            localStorage.setItem("yl_access_token", newToken);
        }
    };

    const filteredEndpoints = API_ENDPOINTS.filter((ep) => {
        const matchesTag = selectedTag === "ALL" || ep.tag === selectedTag;
        const matchesSearch =
            ep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ep.method.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    });

    const handleExecute = async (ep: ApiEndpoint) => {
        setLoadingMap((prev) => ({ ...prev, [ep.id]: true }));
        const startTime = performance.now();

        try {
            // Build URL
            let targetPath = ep.path;
            const epParams = paramValues[ep.id] || {};

            // Substitute path parameters
            if (ep.params) {
                ep.params.forEach((p) => {
                    const val = epParams[p.name];
                    if (p.in === "path" && val !== undefined && val !== "") {
                        targetPath = targetPath.replace(`{${p.name}}`, encodeURIComponent(String(val)));
                    }
                });
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (ep.params) {
                ep.params.forEach((p) => {
                    const val = epParams[p.name];
                    if (p.in === "query" && val !== undefined && val !== "") {
                        queryParams.append(p.name, String(val));
                    }
                });
            }

            const fullUrl = `${OPENAPI_SPEC_INFO.baseUrl}${targetPath}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

            // Build headers
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            if (ep.authRequired && token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            // Options
            const fetchOpts: RequestInit = {
                method: ep.method,
                headers,
            };

            if (["POST", "PUT", "PATCH"].includes(ep.method)) {
                const bodyRaw = bodyValues[ep.id] !== undefined
                    ? bodyValues[ep.id]
                    : JSON.stringify(ep.requestBodySample || {});
                if (bodyRaw) {
                    fetchOpts.body = bodyRaw;
                }
            }

            const res = await fetch(fullUrl, fetchOpts);
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            let resData;
            try {
                resData = await res.json();
            } catch {
                resData = await res.text();
            }

            setResponses((prev) => ({
                ...prev,
                [ep.id]: {
                    status: res.status,
                    data: resData,
                    duration,
                },
            }));
        } catch (err: any) {
            const endTime = performance.now();
            setResponses((prev) => ({
                ...prev,
                [ep.id]: {
                    status: 0,
                    data: null,
                    error: err.message || "Network Error / Failed to connect to API backend",
                    duration: Math.round(endTime - startTime),
                },
            }));
        } finally {
            setLoadingMap((prev) => ({ ...prev, [ep.id]: false }));
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getMethodBadgeClass = (method: string) => {
        switch (method) {
            case "GET":
                return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-900/30 dark:text-blue-400";
            case "POST":
                return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-900/30 dark:text-emerald-400";
            case "PUT":
                return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-900/30 dark:text-amber-400";
            case "DELETE":
                return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-900/30 dark:text-rose-400";
            case "PATCH":
                return "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-900/30 dark:text-purple-400";
            default:
                return "bg-slate-500/10 text-slate-600 border-slate-500/20";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
            {/* Top Navigation Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                            YL
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight">YakinLulus.id API Explorer</h1>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-mono font-medium">
                                    {OPENAPI_SPEC_INFO.version}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Server className="w-3.5 h-3.5 text-emerald-500" />
                                Base URL: <code className="font-mono text-slate-700 dark:text-slate-300">{OPENAPI_SPEC_INFO.baseUrl}</code>
                            </p>
                        </div>
                    </div>

                    {/* View mode tabs */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode("EXPLORER")}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === "EXPLORER"
                                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                        >
                            Interactive Explorer
                        </button>
                        <button
                            onClick={() => setViewMode("SWAGGER")}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${viewMode === "SWAGGER"
                                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                        >
                            Swagger UI <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Token Bar & Global Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="w-full md:w-1/2 relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari endpoint, URL path, atau HTTP method..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="w-full md:w-1/2 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Key className="w-4 h-4 absolute left-3.5 top-3 text-amber-500" />
                            <input
                                type="password"
                                placeholder="JWT Bearer Token (yl_access_token)"
                                value={token}
                                onChange={(e) => handleSaveToken(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    const saved = localStorage.getItem("yl_access_token") || "";
                                    setToken(saved);
                                }
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all"
                            title="Reload token dari LocalStorage"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {viewMode === "SWAGGER" ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm h-[800px]">
                        <iframe
                            src={OPENAPI_SPEC_INFO.swaggerUrl}
                            className="w-full h-full border-none"
                            title="Swagger UI OpenAPI Docs"
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar Category Filter */}
                        <div className="lg:col-span-1 space-y-2">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                                    Modul API ({API_TAGS.length})
                                </h3>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setSelectedTag("ALL")}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${selectedTag === "ALL"
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span>Semua Modul</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
                                            {API_ENDPOINTS.length}
                                        </span>
                                    </button>
                                    {API_TAGS.map((tag) => {
                                        const count = API_ENDPOINTS.filter((e) => e.tag === tag).length;
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => setSelectedTag(tag)}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${selectedTag === tag
                                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                <span>{tag}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedTag === tag ? "bg-white/20" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Endpoints List */}
                        <div className="lg:col-span-3 space-y-4">
                            {filteredEndpoints.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tidak ada endpoint ditemukan</h3>
                                    <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter modul API Anda.</p>
                                </div>
                            ) : (
                                filteredEndpoints.map((ep) => {
                                    const epResponse = responses[ep.id];
                                    const isLoading = loadingMap[ep.id];

                                    return (
                                        <div
                                            key={ep.id}
                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
                                        >
                                            {/* Card Header */}
                                            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getMethodBadgeClass(ep.method)}`}>
                                                        {ep.method}
                                                    </span>
                                                    <code className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                                                        {ep.path}
                                                    </code>
                                                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                                        {ep.tag}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => handleExecute(ep)}
                                                    disabled={isLoading}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all"
                                                >
                                                    {isLoading ? (
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Play className="w-3.5 h-3.5 fill-current" />
                                                    )}
                                                    Execute API
                                                </button>
                                            </div>

                                            {/* Summary & Params Body */}
                                            <div className="p-4 sm:p-5 space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                        {ep.summary}
                                                    </h4>
                                                    {ep.authRequired && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 font-medium">
                                                            <ShieldAlert className="w-3.5 h-3.5" /> Authorization: Bearer JWT Required
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Parameters Input Section */}
                                                {ep.params && ep.params.length > 0 && (
                                                    <div className="space-y-2">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parameters</span>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {ep.params.map((p) => (
                                                                <div key={p.name} className="space-y-1">
                                                                    <label className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                                        <span>
                                                                            {p.name} <span className="text-slate-400 font-normal">({p.in})</span>
                                                                        </span>
                                                                        {p.required && <span className="text-[10px] text-rose-500 font-bold">*Wajib</span>}
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder={p.defaultValue !== undefined ? `Default: ${p.defaultValue}` : p.enum ? `Enum: ${p.enum.join(", ")}` : `Masukkan ${p.name}`}
                                                                        value={paramValues[ep.id]?.[p.name] || ""}
                                                                        onChange={(e) =>
                                                                            setParamValues((prev) => ({
                                                                                ...prev,
                                                                                [ep.id]: {
                                                                                    ...prev[ep.id],
                                                                                    [p.name]: e.target.value,
                                                                                },
                                                                            }))
                                                                        }
                                                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Request Body JSON Input */}
                                                {["POST", "PUT", "PATCH"].includes(ep.method) && (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Request Body (JSON)</span>
                                                            <button
                                                                onClick={() =>
                                                                    setBodyValues((prev) => ({
                                                                        ...prev,
                                                                        [ep.id]: JSON.stringify(ep.requestBodySample || {}, null, 2),
                                                                    }))
                                                                }
                                                                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                            >
                                                                Reset Contoh Sample
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={4}
                                                            value={
                                                                bodyValues[ep.id] !== undefined
                                                                    ? bodyValues[ep.id]
                                                                    : JSON.stringify(ep.requestBodySample || {}, null, 2)
                                                            }
                                                            onChange={(e) =>
                                                                setBodyValues((prev) => ({
                                                                    ...prev,
                                                                    [ep.id]: e.target.value,
                                                                }))
                                                            }
                                                            className="w-full p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                                                        />
                                                    </div>
                                                )}

                                                {/* Response Output Section */}
                                                {epResponse && (
                                                    <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${epResponse.status >= 200 && epResponse.status < 300
                                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                                                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                                                                        }`}
                                                                >
                                                                    Status: {epResponse.status || "ERR"}
                                                                </span>
                                                                <span className="text-xs text-slate-400 font-mono">
                                                                    Latency: {epResponse.duration} ms
                                                                </span>
                                                            </div>

                                                            <button
                                                                onClick={() => copyToClipboard(JSON.stringify(epResponse.data || epResponse.error, null, 2), `res-${ep.id}`)}
                                                                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                                                            >
                                                                {copiedId === `res-${ep.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                                Copy Response
                                                            </button>
                                                        </div>

                                                        <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-80 leading-relaxed">
                                                            {epResponse.error
                                                                ? `[Error]: ${epResponse.error}`
                                                                : JSON.stringify(epResponse.data, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
