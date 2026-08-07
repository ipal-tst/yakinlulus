"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Bot, Send, User as UserIcon, Sparkles, HelpCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
    id: string;
    sender: "ai" | "user";
    text: string;
    timestamp: string;
}

const PROMPT_SUGGESTIONS = [
    "Jelaskan rumus cepat Penalaran Matematika UTBK",
    "Bagaimana cara menentukan ide pokok teks panjang?",
    "Bantu saya menganalisis kesalahan di Try Out #5",
    "Beri tips mengatasi cemas saat waktu ujian berkurang",
];

export default function AITutorPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "1",
            sender: "ai",
            text: "Halo! Saya AI Tutor YakinLulus.id. Ada materi atau soal UTBK SNBT yang ingin kamu diskusikan hari ini?",
            timestamp: "Baru saja",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = (textToSend?: string) => {
        const query = textToSend || input;
        if (!query.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: "user",
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setInput("");
        setLoading(true);

        setTimeout(() => {
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: `Pertanyaan bagus mengenai: "${query}". Untuk menyelesaikan tipe soal ini pada UTBK SNBT, langkah kuncinya adalah:

1. **Identifikasi Kata Kunci:** Cari variabel utama atau topik paragraf.
2. **Pola Persamaan:** Ubah pernyataan verbal menjadi bentuk aljabar dasar.
3. **Eliminasi Opsi:** Cek opsi jawaban yang secara logika tidak memungkinkan terlebih dahulu.

Apakah ada langkah tertentu yang ingin diperdalam?`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setLoading(false);
        }, 1000);
    };

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="font-heading text-lg font-bold flex items-center gap-2">
                            AI Tutor YakinLulus <Badge variant="secondary" className="text-[10px] gap-1"><Sparkles className="h-3 w-3" /> Gemini 2.5</Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground">Tanyakan konsep, pembahasan soal, atau strategi belajar UTBK 24/7.</p>
                    </div>
                </div>

                {/* Prompt Suggestions */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PROMPT_SUGGESTIONS.map((sug, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(sug)}
                            className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium hover:border-primary hover:text-primary transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                        >
                            <Lightbulb className="h-3 w-3 text-amber-500" />
                            <span>{sug}</span>
                        </button>
                    ))}
                </div>

                {/* Chat Messages Body */}
                <Card className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={cn(
                                "flex gap-3 max-w-2xl",
                                m.sender === "user" ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                                    m.sender === "ai"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground"
                                )}
                            >
                                {m.sender === "ai" ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                            </div>

                            <div
                                className={cn(
                                    "p-4 rounded-2xl text-xs md:text-sm leading-relaxed space-y-1",
                                    m.sender === "ai"
                                        ? "bg-muted text-foreground rounded-tl-none whitespace-pre-line"
                                        : "bg-primary text-primary-foreground rounded-tr-none"
                                )}
                            >
                                <p>{m.text}</p>
                                <span
                                    className={cn(
                                        "block text-[10px] text-right pt-1",
                                        m.sender === "ai" ? "text-muted-foreground" : "text-primary-foreground/70"
                                    )}
                                >
                                    {m.timestamp}
                                </span>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 max-w-md">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-none bg-muted text-xs text-muted-foreground animate-pulse">
                                AI Tutor sedang mengetik penjelasan...
                            </div>
                        </div>
                    )}
                </Card>

                {/* Input Bar */}
                <div className="flex items-center gap-2 pt-2">
                    <Input
                        placeholder="Tanyakan materi atau masukkan teks soal..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        disabled={loading}
                        className="h-12 rounded-xl text-sm"
                    />
                    <Button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="h-12 px-5 rounded-xl font-semibold gap-2"
                    >
                        <span>Kirim</span> <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </AppShell>
    );
}
