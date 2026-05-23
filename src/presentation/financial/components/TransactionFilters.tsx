"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function TransactionFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
    const initialStatus = searchParams.getAll("status");
    const [statusFilter, setStatusFilter] = useState<string[]>(initialStatus);
    
    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchQuery) {
                params.set("query", searchQuery);
            } else {
                params.delete("query");
            }
            router.push(`${pathname}?${params.toString()}`);
        }, 300);
        
        return () => clearTimeout(timer);
    }, [searchQuery, pathname, router, searchParams]);

    const handleStatusChange = useCallback((status: string, checked: boolean) => {
        const newStatusFilter = checked 
            ? [...statusFilter, status] 
            : statusFilter.filter(s => s !== status);
            
        setStatusFilter(newStatusFilter);
        
        const params = new URLSearchParams(searchParams.toString());
        params.delete("status");
        newStatusFilter.forEach(s => params.append("status", s));
        
        router.push(`${pathname}?${params.toString()}`);
    }, [statusFilter, pathname, router, searchParams]);

    return (
        <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input 
                    placeholder="Buscar transacciones, comercios o categorías..." 
                    className="pl-9 bg-background/50 backdrop-blur-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto gap-2 bg-background/50 backdrop-blur-sm">
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtros
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {['DETECTED', 'REVIEWED', 'CONFIRMED', 'MANUAL'].map(status => (
                            <DropdownMenuCheckboxItem 
                                key={status}
                                checked={statusFilter.includes(status)}
                                onCheckedChange={(checked) => handleStatusChange(status, checked)}
                            >
                                {status}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
