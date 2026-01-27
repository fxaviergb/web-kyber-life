import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all",
  {
    variants: {
      variant: {
        default: "bg-bg-tertiary text-text-primary border border-border-base",
        primary: "bg-accent-primary/10 text-accent-primary border border-accent-primary/20",
        success: "bg-success-bg text-success-text border border-accent-success/20",
        warning: "bg-warning-bg text-warning-text border border-accent-warning/20",
        danger: "bg-danger-bg text-danger-text border border-accent-danger/20",
        info: "bg-info-bg text-info-text border border-accent-info/20",
        outline: "border border-border-base text-text-secondary bg-transparent",
        ghost: "text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
