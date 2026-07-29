"use client";

import * as React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface MathKaTeXPreviewProps {
    content: string;
    className?: string;
}

/**
 * Parses raw text containing inline LaTeX ($...$) and block LaTeX ($$...$$)
 * and renders formatted mathematical formulas using KaTeX.
 */
export function MathKaTeXPreview({ content, className }: MathKaTeXPreviewProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const renderedContent = React.useMemo(() => {
        if (!content) return "";

        try {
            // Simple regex parser for LaTeX expressions
            return content.replace(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g, (match) => {
                const isBlock = match.startsWith("$$") && match.endsWith("$$");
                const formula = isBlock ? match.slice(2, -2) : match.slice(1, -1);

                try {
                    return katex.renderToString(formula, {
                        displayMode: isBlock,
                        throwOnError: false,
                    });
                } catch {
                    return match;
                }
            });
        } catch {
            return content;
        }
    }, [content]);

    return (
        <div
            ref={containerRef}
            className={cn("prose dark:prose-invert max-w-none text-sm leading-relaxed", className)}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
    );
}
