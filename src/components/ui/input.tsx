import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary shadow-sm transition-all outline-none",
        "placeholder:text-text-tertiary",
        "focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
        className
      )}
      {...props}
    />
  )
}

export { Input }
