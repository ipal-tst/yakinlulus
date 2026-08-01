import type { Metadata } from "next";
import { Quicksand, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { APP_CONFIG } from "@/config/app";

const quicksand = Quicksand({
    subsets: ["latin"],
    variable: "--font-quicksand",
    display: "swap",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: `${APP_CONFIG.name} - ${APP_CONFIG.description}`,
    description: APP_CONFIG.description,
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id" suppressHydrationWarning>
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
                />
            </head>
            <body
                className={`${quicksand.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary-foreground`}
            >
                <QueryProvider>
                    <ThemeProvider>{children}</ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
