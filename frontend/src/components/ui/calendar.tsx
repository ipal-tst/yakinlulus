import * as React from "react"

import { cn } from "@/lib/utils"

const Calendar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-3", className)}
    {...props}
  />
))
Calendar.displayName = "Calendar"

export { Calendar }