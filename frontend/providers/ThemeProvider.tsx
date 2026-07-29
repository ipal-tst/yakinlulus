"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { THEME_CONFIG } from "@/config/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme={THEME_CONFIG.defaultTheme}
            enableSystem={true}
            storageKey={THEME_CONFIG.storageKey}
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}
