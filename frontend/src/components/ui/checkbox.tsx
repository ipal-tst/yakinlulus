import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
    indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, indeterminate, ...props }, ref) => {
        const innerRef = React.useRef<HTMLInputElement>(null);
        React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

        React.useEffect(() => {
            if (innerRef.current) {
                innerRef.current.indeterminate = Boolean(indeterminate && !props.checked);
            }
        }, [indeterminate, props.checked]);

        return (
            <input
                type="checkbox"
                ref={innerRef}
                className={cn(
                    "h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-primary focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        );
    }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
