import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
};

export function Avatar({
    src,
    alt = "User",
    fallback = "YL",
    size = "md",
    className,
    ...props
}: AvatarProps) {
    const [imageError, setImageError] = React.useState(false);

    return (
        <div
            className={cn(
                "relative flex shrink-0 overflow-hidden rounded-full bg-secondary font-medium text-secondary-foreground items-center justify-center border border-border/50",
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {src && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={alt}
                    onError={() => setImageError(true)}
                    className="aspect-square h-full w-full object-cover"
                />
            ) : (
                <span>{fallback.toUpperCase()}</span>
            )}
        </div>
    );
}
