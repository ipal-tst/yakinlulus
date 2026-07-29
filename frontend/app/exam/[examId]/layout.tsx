"use client";

import * as React from "react";

export default function CBTExamLayout({ children }: { children: React.ReactNode }) {
    // BeforeUnload guard against accidental exit during active CBT exam
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Sesi Ujian CBT sedang berlangsung. Jawaban Anda disimpan otomatis. Yakin ingin keluar?";
            return e.returnValue;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 flex flex-col">
            {children}
        </div>
    );
}
