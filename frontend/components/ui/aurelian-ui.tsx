"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Aurelian Academy Checkbox — 24x24, heavy stroke, pop animation on check.
 * Wraps native input so form libraries (RHF/Zod) still work.
 */
export interface AurelianCheckboxProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
    label?: string;
    size?: "sm" | "md" | "lg";
}

export function AurelianCheckbox({
    className,
    label,
    size = "md",
    id,
    ...props
}: AurelianCheckboxProps) {
    const sizeMap = {
        sm: "h-5 w-5",
        md: "h-6 w-6",  // 24px default
        lg: "h-7 w-7",
    };

    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
        <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer group">
            <input
                type="checkbox"
                id={inputId}
                className={cn(
                    "checkbox-pop appearance-none rounded-sm border-2 border-outline",
                    "checked:border-primary checked:bg-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "transition-all duration-150",
                    "relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center",
                    "after:text-on-primary after:font-bold after:text-xs after:opacity-0 after:scale-0",
                    "checked:after:opacity-100 after:transition-all after:duration-200 after:ease-out",
                    sizeMap[size],
                    props.disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                {...props}
            />
            {label && (
                <span className="text-sm font-medium text-on-surface select-none group-hover:text-primary transition-colors">
                    {label}
                </span>
            )}
        </label>
    );
}

/**
 * Aurelian Academy Button — Pseudo-3D tactile, pill-shaped, min-48px.
 */
export type AurelianButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger";
export type AurelianButtonSize = "sm" | "md" | "lg";

export interface AurelianButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: AurelianButtonVariant;
    size?: AurelianButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
}

const variantStyles: Record<AurelianButtonVariant, string> = {
    primary:
        "bg-primary text-on-primary border border-primary " +
        "shadow-[0_4px_0_#003da6] hover:shadow-[0_6px_0_#003da6] hover:-translate-y-0.5 " +
        "active:shadow-[0_2px_0_#003da6] active:translate-y-0.5 " +
        "transition-all duration-150 ease-out",
    secondary:
        "bg-secondary text-on-secondary border border-secondary " +
        "shadow-[0_4px_0_#005238] hover:shadow-[0_6px_0_#005238] hover:-translate-y-0.5 " +
        "active:shadow-[0_2px_0_#005238] active:translate-y-0.5 " +
        "transition-all duration-150 ease-out",
    tertiary:
        "bg-tertiary text-on-tertiary border border-tertiary " +
        "shadow-[0_4px_0_#5c3a00] hover:shadow-[0_6px_0_#5c3a00] hover:-translate-y-0.5 " +
        "active:shadow-[0_2px_0_#5c3a00] active:translate-y-0.5 " +
        "transition-all duration-150 ease-out",
    outline:
        "bg-transparent text-primary border-2 border-primary " +
        "hover:bg-primary/5 active:bg-primary/10 " +
        "transition-all duration-150",
    ghost:
        "bg-transparent text-on-surface border border-transparent " +
        "hover:bg-accent active:bg-accent/80 " +
        "transition-all duration-150",
    danger:
        "bg-error text-on-error border border-error " +
        "shadow-[0_4px_0_#93000a] hover:shadow-[0_6px_0_#93000a] hover:-translate-y-0.5 " +
        "active:shadow-[0_2px_0_#93000a] active:translate-y-0.5 " +
        "transition-all duration-150 ease-out",
};

const sizeStyles: Record<AurelianButtonSize, string> = {
    sm: "h-10 px-4 text-xs font-bold rounded-[20px]",
    md: "h-12 px-6 text-sm font-bold rounded-full",     // min 48px
    lg: "h-14 px-8 text-base font-bold rounded-full",
};

export function AurelianButton({
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    children,
    className,
    disabled,
    ...props
}: AurelianButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={cn(
                "inline-flex items-center justify-center gap-2 font-bold select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                variantStyles[variant],
                sizeStyles[size],
                (disabled || loading) && "opacity-50 cursor-not-allowed pointer-events-none",
                className
            )}
            {...props}
        >
            {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : icon ? (
                <span className="flex-shrink-0">{icon}</span>
            ) : null}
            {children && <span>{children}</span>}
        </button>
    );
}