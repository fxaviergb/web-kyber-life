import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  {
    variants: {
      variant: {
        default: "bg-accent-primary text-white hover:bg-accent-primary-hover shadow-sm hover:shadow-md",
        destructive:
          "bg-accent-danger text-white hover:bg-accent-danger/90 shadow-sm hover:shadow-md focus-visible:ring-accent-danger",
        outline:
          "border border-border-base bg-transparent hover:bg-bg-hover text-text-primary shadow-sm",
        secondary:
          "bg-bg-tertiary text-text-primary hover:bg-bg-hover shadow-sm",
        ghost:
          "hover:bg-bg-hover text-text-secondary hover:text-text-primary",
        link: "text-accent-primary underline-offset-4 hover:underline",
        success: "bg-accent-success text-white hover:bg-accent-success/90 shadow-sm hover:shadow-md focus-visible:ring-accent-success",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4 text-base",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
