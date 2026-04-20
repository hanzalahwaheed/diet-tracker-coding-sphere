import * as React from "react"

import { cn } from "@/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-8 w-full min-w-0 border border-border bg-background px-2.5 py-1 text-xs transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
        "dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { Select }
