import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full min-w-0 border border-border bg-background px-2.5 py-1.5 text-xs transition-colors outline-none",
        "placeholder:text-muted-foreground",
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

export { Textarea }
