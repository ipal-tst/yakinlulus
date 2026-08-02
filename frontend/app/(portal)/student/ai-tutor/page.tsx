"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Cpu, RotateCw, BookOpen } from "lucide-react";

interface ChatMessage {
    sender: "user" | "ai";
    text: string;
    timestamp: string;
    model?: string;
}

const QUICK_PROMPTS = [
    "Jelaskan rumus aljabar sederhana",
    "Contoh soal TPS penalaran",
    "Tips vocab untuk Literasi Inggris",
    "Rumus fisika gerak lurus",
];

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
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">AI Tutor</h1>
                        <p className="text-xs text-muted-foreground">Asisten belajarmu berbasis RAG</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
                    >
                        <option value="Penalaran Matematika">Penalaran Matematika</option>
                        <option value="Penalaran Umum">Penalaran Umum</option>
                        <option value="Literasi Bahasa Indonesia">Literasi Bahasa Indonesia</option>
                        <option value="Literasi Bahasa Inggris">Literasi Bahasa Inggris</option>
                    </select>
                </div>
            </header>

            {/* Quick actions */}
            <div className="flex overflow-x-auto gap-2 no-scrollbar">
                {QUICK_PROMPTS.map((prompt) => (
                    <button
                        key={prompt}
                        type="button"
                        onClick={() => setInput(prompt)}
                        className="px-4 py-2 rounded-full bg-card border border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary shrink-0 transition-colors"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Chat */}
            <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[520px]">
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className="max-w-[75%] space-y-1">
                                <div
                                    className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === "user"
                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                                        : "bg-muted rounded-2xl rounded-tl-md"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                                    <span>{msg.timestamp}</span>
                                    {msg.model && (
                                        <span className="flex items-center gap-1">
                                            <Cpu className="h-3 w-3" /> {msg.model}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                            <RotateCw className="h-3.5 w-3.5 animate-spin text-primary" />
                            AI sedang memproses rasionalisasi jawaban...
                        </div>
                    )}
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t border-border">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Tanyakan soal, rumus aljabar, atau trik penalaran..."
                            className="flex-1 px-5 py-3 bg-muted rounded-full border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-full shrink-0"
                            disabled={loading || !input.trim()}
                            aria-label="Kirim"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
