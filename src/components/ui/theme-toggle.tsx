"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Render placeholder with same dimensions to prevent layout shift
        return (
            <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${className}`}
                disabled
            >
                <Sun className="h-[1.2rem] w-[1.2rem] text-gray-500" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${className}`}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-500 dark:text-text-primary group-hover:text-text-primary" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-500 dark:text-text-primary group-hover:text-text-primary" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
