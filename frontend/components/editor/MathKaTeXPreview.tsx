"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface MathKaTeXPreviewProps {
    content: string;
    className?: string;
    invertDark?: boolean;
}

/**
 * Renders markdown (text, images, tables, lists) with inline/block LaTeX
 * math via KaTeX. Raw HTML is never rendered (XSS-safe by default).
 */
export function MathKaTeXPreview({ content, className, invertDark = true }: MathKaTeXPreviewProps) {
    return (
        <div suppressHydrationWarning className={cn("prose prose-sm md:prose-base max-w-none leading-relaxed", invertDark && "dark:prose-invert", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    img: ({ node, src, alt, ...props }) => {
                        if (!src) return null;
                        return <img {...props} src={src} alt={alt} className="mx-auto my-4 max-h-96 w-auto max-w-full rounded-lg" />;
                    },
                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                }}
            >
                {content || ""}
            </ReactMarkdown>
        </div>
    );
}
