"use client";

import { Menu, Search, Bell, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TopbarProps {
    onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border-base bg-bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-bg-secondary/60 px-4 md:px-6">
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-bg-hover"
                onClick={onMenuClick}
                aria-label="Toggle menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop Search */}
            <div className="flex-1 max-w-md hidden md:block">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-9 bg-bg-primary border-border-base text-text-primary placeholder:text-text-tertiary focus:ring-accent-primary focus:border-accent-primary"
                    />
                </div>
            </div>

            {/* Mobile Search Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-bg-hover"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
            >
                <Search className="h-5 w-5" />
            </Button>

            {/* Spacer for mobile (pushes actions to right) */}
            <div className="flex-1 md:hidden" />

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />

                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-bg-hover"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5 text-text-secondary" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent-danger rounded-full" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-bg-hover"
                    aria-label="User menu"
                >
                    <User className="h-5 w-5 text-text-secondary" />
                </Button>
            </div>

            {/* Mobile Search Expanded (Below on mobile when open) */}
            {searchOpen && (
                <div className="absolute top-16 left-0 right-0 p-4 bg-bg-secondary border-b border-border-base md:hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9 bg-bg-primary border-border-base w-full"
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
