import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge to prevent utility conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
