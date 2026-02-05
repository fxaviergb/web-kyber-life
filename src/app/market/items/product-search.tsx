"use client";

import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function ProductSearch() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const initialQuery = searchParams.get("q") || "";
    const [value, setValue] = useState(initialQuery);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (value === initialQuery) return;

            const params = new URLSearchParams(searchParams);
            if (value.trim()) {
                params.set("q", value.trim());
            } else {
                params.delete("q");
            }

            startTransition(() => {
                router.replace(`?${params.toString()}`);
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [value, initialQuery, router, searchParams]);

    return (
        <div className="relative w-full sm:w-[300px] group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 group-focus-within:text-accent-primary transition-colors">
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Search className="h-4 w-4" />
                )}
            </div>
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Buscar productos..."
                className="pl-9 pr-8 bg-surface-1 border-border-1 rounded-full focus-visible:ring-accent-primary/20 transition-all hover:bg-surface-2"
            />
            {value && (
                <button
                    onClick={() => setValue("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-1"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
