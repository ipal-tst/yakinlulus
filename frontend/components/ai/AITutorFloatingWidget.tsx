"use client";

import * as React from "react";
import { Sparkles, X, Send, Bot, User, Lightbulb, Zap, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";

interface ChatMessage {
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp: string;
}

interface AITutorFloatingWidgetProps {
    contextQuestionCode?: string;
    contextSubtest?: string;
}

export function AITutorFloatingWidget({
    contextQuestionCode = "KUANT-001",
    contextSubtest = "Penalaran Kuantitatif",
}: AITutorFloatingWidgetProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [input, setInput] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);

    const [messages, setMessages] = React.useState<ChatMessage[]>([
        {
            id: "1",
            sender: "ai",
            text: `Halo! Saya **AI Tutor YakinLulus**. Saya siap membantu kamu memahami konsep & rumus pembahasan soal **${contextQuestionCode}** (${contextSubtest}). Ada yang ingin kamu tanyakan?`,
            timestamp: "Baru saja",
        },
    ]);

    const quickPrompts = [
        { label: "Jelaskan Langkah Rumus", prompt: `Jelaskan rumus konsep dan penyelesaian step-by-step untuk soal ${contextQuestionCode} ini.` },
        { label: "Beri 1 Soal Sejenis", prompt: `Berikan 1 latihan soal sejenis ${contextQuestionCode} beserta jawaban dan pembahasannya.` },
        { label: "Trik Pengerjaan Cepat", prompt: `Apakah ada cara cepat / trik 30 detik untuk mengerjakan tipe soal ${contextQuestionCode} ini?` },
    ];

    const handleSendMessage = (textToSend?: string) => {
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
        setIsTyping(true);

        // Simulated AI response with LaTeX math
        setTimeout(() => {
            let aiText = "Tentu! Mari kita bedah konsep ini bersama. ";
            if (query.includes("Rumus") || query.includes("langkah")) {
                aiText = `Untuk menyelesaikan soal **${contextQuestionCode}**, gunakan konsep kalkulus diferensial:\n\n$$f'(x) = \\frac{d}{dx}(2x^3 - 3x^2 + 5) = 6x^2 - 6x$$\n\nSubstitusikan $x = 2$:\n$$f'(2) = 6(2)^2 - 6(2) = 24 - 12 = 12$$\n\nJadi, jawaban yang tepat adalah **12 (Opsi A)**.`;
            } else if (query.includes("Sejenis")) {
                aiText = `**Latihan Soal Sejenis:**\n\nJika $g(x) = 3x^2 - 4x + 1$, berapakah nilai turunan $g'(x)$ saat $x = 3$?\n\n*Penyelesaian Quick Check:* $g'(x) = 6x - 4 \\Rightarrow g'(3) = 14$.`;
            } else if (query.includes("Trik")) {
                aiText = `⚡ **Trik Cepat 30 Detik:**\nIngat aturan pangkat $d(ax^n)/dx = n \\cdot a \\cdot x^{n-1}$. Untuk suku konstanta ($+5$), turunannya selalu **0**. Cukup fokus ke suku variabel berderajat tertinggi!`;
            } else {
                aiText = `Pertanyaan bagus! Pada materi **${contextSubtest}**, kunci utamanya adalah mengidentifikasi pola hubungan variabel secara matematis sebelum melakukan substitusi nilai.`;
            }

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: aiText,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            setMessages((prev) => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Launcher Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    size="lg"
                    className="h-14 px-5 rounded-full shadow-2xl bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform flex items-center gap-3 border-2 border-background"
                >
                    <div className="relative">
                        <Sparkles className="h-6 w-6 text-primary-foreground animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                        </span>
                    </div>
                    <div className="text-left font-bold text-xs text-primary-foreground leading-tight">
                        <span>Tanya AI Tutor</span>
                        <span className="block text-[10px] opacity-80 font-normal">Bantuan Pembahasan Soal</span>
                    </div>
                </Button>
            )}

            {/* Chat Drawer Window */}
            {isOpen && (
                <Card className="w-[360px] sm:w-[400px] h-[520px] shadow-2xl border-primary/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center border border-primary-foreground/20">
                                <Sparkles className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                                    AI Tutor Companion
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-warning text-warning-foreground font-bold">
                                        PRO
                                    </Badge>
                                </CardTitle>
                                <p className="text-[11px] opacity-80 font-mono">Context: {contextQuestionCode}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    {/* Messages Body */}
                    <CardContent className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/20 text-xs">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div
                                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0 ${msg.sender === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-warning text-warning-foreground"
                                        }`}
                                >
                                    {msg.sender === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                </div>
                                <div
                                    className={`max-w-[80%] rounded-2xl p-3 shadow-xs space-y-1 ${msg.sender === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                                            : "bg-card border text-card-foreground rounded-tl-xs"
                                        }`}
                                >
                                    <MathKaTeXPreview content={msg.text} />
                                    <span
                                        className={`text-[9px] block text-right font-mono ${msg.sender === "user" ? "opacity-70" : "text-muted-foreground"
                                            }`}
                                    >
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-2 items-center text-muted-foreground text-xs italic">
                                <Bot className="h-4 w-4 text-warning animate-spin" />
                                <span>AI Tutor sedang memikirkan penjelasan...</span>
                            </div>
                        )}
                    </CardContent>

                    {/* Quick Prompts Bar */}
                    <div className="p-2 border-t bg-card flex items-center gap-1.5 overflow-x-auto shrink-0">
                        {quickPrompts.map((qp, i) => (
                            <button
                                key={i}
                                onClick={() => handleSendMessage(qp.prompt)}
                                className="px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-[10px] font-medium whitespace-nowrap text-secondary-foreground transition-colors cursor-pointer border"
                            >
                                {qp.label}
                            </button>
                        ))}
                    </div>

                    {/* Input Footer */}
                    <div className="p-3 border-t bg-card flex items-center gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Tanyakan konsep atau pembahasan..."
                            className="flex-1 bg-muted/40 border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Button
                            size="sm"
                            disabled={!input.trim() || isTyping}
                            onClick={() => handleSendMessage()}
                            className="h-9 w-9 p-0 rounded-xl"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
