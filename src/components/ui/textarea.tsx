import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full min-w-0 rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary shadow-sm transition-all outline-none",
        "placeholder:text-text-tertiary",
        "focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "field-sizing-content resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
