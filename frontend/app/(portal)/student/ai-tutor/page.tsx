"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Bot, Send, Sparkles, BookOpen, Cpu, RefreshCw } from "lucide-react";

interface ChatMessage {
    sender: "user" | "ai";
    text: string;
    timestamp: string;
    model?: string;
}

export default function AITutorPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            sender: "ai",
            text: "Selamat datang di **YakinLulus AI Virtual Tutor**! 🚀\nSaya siap membantumu membedah soal UTBK/SNBT, konsep Matematika, TPS, hingga Bahasa Inggris dengan RAG Knowledge Base.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            model: "Gemini-1.5-Pro (RAG Vector Active)",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState("Penalaran Matematika");

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: ChatMessage = {
            sender: "user",
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await apiClient.ai.tutorChat(userMsg.text, selectedSubject);
            const aiData = res.data as { reply?: string; model?: string };

            const aiMsg: ChatMessage = {
                sender: "ai",
                text: aiData?.reply || "Terjadi kendala analisis AI.",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                model: aiData?.model || "Gemini-1.5-Pro",
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: `⚠️ Maaf, gagal menghubungkan ke AI Tutor Server: ${err.message || "Network Error"}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-blue-900/40 text-white shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-300">
                        <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Virtual Tutor Workspace</h1>
                        <p className="text-sm text-blue-200/80">
                            Asisten Pintar Berbasis Retrieval-Augmented Generation (RAG) & Vector Database Qdrant
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none text-slate-200 cursor-pointer"
                    >
                        <option value="Penalaran Matematika" className="bg-slate-900 text-white">Penalaran Matematika</option>
                        <option value="Penalaran Umum" className="bg-slate-900 text-white">Penalaran Umum</option>
                        <option value="Literasi Bahasa Indonesia" className="bg-slate-900 text-white">Literasi Bahasa Indonesia</option>
                        <option value="Literasi Bahasa Inggris" className="bg-slate-900 text-white">Literasi Bahasa Inggris</option>
                    </select>
                </div>
            </div>

            {/* Chat Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[550px]">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${msg.sender === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                    }`}
                            >
                                {msg.sender === "user" ? "U" : <Bot className="w-5 h-5" />}
                            </div>

                            <div className={`max-w-[78%] space-y-1`}>
                                <div
                                    className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === "user"
                                        ? "bg-blue-600 text-white rounded-tr-none"
                                        : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                                    <span>{msg.timestamp}</span>
                                    {msg.model && (
                                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                            <Cpu className="w-3 h-3" /> {msg.model}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-3 text-slate-400 text-sm italic py-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            AI sedang memproses rasionalisasi jawaban...
                        </div>
                    )}
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Tanyakan soal, rumus aljabar, atau trik penalaran..."
                            className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition flex items-center gap-2 shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                            Kirim
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
