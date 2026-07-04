"use client";

import { useRef, useState, useEffect, ReactNode, Children } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileCarousel({ children, className }: { children: ReactNode; className?: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            // Use a small threshold (e.g. 1px) to account for fractional pixel rounding errors
            setCanScrollLeft(scrollLeft > 1);
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        // Also check on mount in case layout is already overflowing
        setTimeout(checkScroll, 100);
        return () => window.removeEventListener("resize", checkScroll);
    }, [children]);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const clientWidth = scrollRef.current.clientWidth;
            // On mobile we snap, so scrolling by clientWidth moves exactly one item
            scrollRef.current.scrollBy({
                left: direction === "left" ? -clientWidth : clientWidth,
                behavior: "smooth",
            });
        }
    };

    // On mobile: flex row, overflow-x-auto, snap. On desktop: vertical flex.
    return (
        <div className={cn("relative w-full", className)}>
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex sm:flex-col sm:space-y-4 gap-4 sm:gap-0 overflow-x-auto sm:overflow-visible snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {Children.map(children, (child) => (
                    <div className="w-full shrink-0 snap-center sm:w-auto sm:shrink sm:snap-none">
                        {child}
                    </div>
                ))}
            </div>

            {/* Mobile Controls (hidden on sm+) */}
            <div className="absolute inset-y-0 -left-3 -right-3 pointer-events-none flex sm:hidden items-center justify-between px-0">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-bg-secondary/90 backdrop-blur-sm border-border-base text-text-secondary disabled:opacity-0 pointer-events-auto transition-opacity shadow-md"
                    onClick={() => scroll("left")}
                    disabled={!canScrollLeft}
                    aria-label="Ver gráfico anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-bg-secondary/90 backdrop-blur-sm border-border-base text-text-secondary disabled:opacity-0 pointer-events-auto transition-opacity shadow-md"
                    onClick={() => scroll("right")}
                    disabled={!canScrollRight}
                    aria-label="Ver siguiente gráfico"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
