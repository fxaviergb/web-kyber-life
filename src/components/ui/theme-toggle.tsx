"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "./button";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 transition-all duration-200"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 text-text-secondary hover:text-text-primary transition-colors" />
            ) : (
                <Moon className="h-4 w-4 text-text-secondary hover:text-text-primary transition-colors" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
