"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, CreditCard } from "lucide-react";
import { MetricCard } from "@/presentation/components/dashboard/metric-card";

interface MetricsCarouselProps {
    averageSpending: number;
    currentMonthSpending: number;
}

export function MetricsCarousel({ averageSpending, currentMonthSpending }: MetricsCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const container = scrollContainerRef.current;
            if (!container) return;

            // Only auto-scroll on mobile (check if scroll is enabled/necessary)
            if (container.scrollWidth <= container.clientWidth) return;

            const cardWidth = container.firstElementChild?.clientWidth || 0;
            const gap = 16; // 1rem gap
            const scrollAmount = cardWidth + gap;

            // Current position
            const currentScroll = container.scrollLeft;
            const maxScroll = container.scrollWidth - container.clientWidth;

            // Tolerance for "at end"
            if (currentScroll >= maxScroll - 10) {
                // Scroll back to start
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                // Scroll to next
                container.scrollTo({ left: currentScroll + scrollAmount, behavior: 'smooth' });
            }

        }, 5000); // 5 seconds interval

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-4 px-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 no-scrollbar"
        >
            <div className="min-w-full snap-center sm:min-w-0 sm:w-auto h-full">
                <MetricCard
                    title="Promedio (6 meses)"
                    value={`$${averageSpending.toFixed(2)} `}
                    icon={TrendingUp}
                    iconClassName="text-accent-info"
                    trend={{ value: 5.2, label: "vs Año pas.", positive: true }}
                />
            </div>
            <div className="min-w-full snap-center sm:min-w-0 sm:w-auto h-full">
                <MetricCard
                    title="Gasto Mes Actual"
                    value={`$${currentMonthSpending.toFixed(2)} `}
                    icon={CreditCard}
                    iconClassName="text-accent-primary"
                    trend={{ value: 0, label: "En curso", positive: true }}
                />
            </div>
        </div>
    );
}
