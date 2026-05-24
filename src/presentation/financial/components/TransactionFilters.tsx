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
            const currentQuery = searchParams.get("query") || "";
            if (searchQuery !== currentQuery) {
                const params = new URLSearchParams(searchParams.toString());
                if (searchQuery) {
                    params.set("query", searchQuery);
                } else {
                    params.delete("query");
                }
                router.push(`${pathname}?${params.toString()}`);
            }
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

    const handleQuickFilter = (type: 'DETECTED' | 'CONFIRMED' | 'Viajes' | 'USD') => {
        const params = new URLSearchParams(searchParams.toString());
        
        // Reset all specific filters we control here before applying
        params.delete("status");
        params.delete("query");
        params.delete("currency");
        setStatusFilter([]);

        switch(type) {
            case 'DETECTED':
                params.append("status", "DETECTED");
                setStatusFilter(["DETECTED"]);
                break;
            case 'CONFIRMED':
                params.append("status", "CONFIRMED");
                setStatusFilter(["CONFIRMED"]);
                break;
            case 'Viajes':
                params.append("query", "Viajes");
                setSearchQuery("Viajes");
                break;
            case 'USD':
                params.append("currency", "USD");
                break;
        }
        
        router.push(`${pathname}?${params.toString()}`);
    };

    const isFilterActive = (type: 'DETECTED' | 'CONFIRMED' | 'Viajes' | 'USD') => {
        if (type === 'DETECTED') return statusFilter.includes('DETECTED') && statusFilter.length === 1 && !searchParams.get("query") && !searchParams.get("currency");
        if (type === 'CONFIRMED') return statusFilter.includes('CONFIRMED') && statusFilter.length === 1 && !searchParams.get("query") && !searchParams.get("currency");
        if (type === 'Viajes') return searchParams.get("query") === 'Viajes' && statusFilter.length === 0 && !searchParams.get("currency");
        if (type === 'USD') return searchParams.get("currency") === 'USD' && statusFilter.length === 0 && !searchParams.get("query");
        return false;
    };

    const hasAnyFilter = statusFilter.length > 0 || searchParams.has("query") || searchParams.has("currency");

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
                        {['DETECTED', 'REVIEWED', 'CONFIRMED', 'REJECTED', 'DUPLICATE', 'MANUAL', 'ARCHIVED'].map(status => (
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
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-3 w-full">
                <Button 
                    variant={isFilterActive('DETECTED') ? 'default' : 'secondary'} 
                    size="sm" 
                    className="h-7 text-xs rounded-full px-3"
                    onClick={() => handleQuickFilter('DETECTED')}
                >
                    Pendientes
                </Button>
                <Button 
                    variant={isFilterActive('CONFIRMED') ? 'default' : 'secondary'} 
                    size="sm" 
                    className="h-7 text-xs rounded-full px-3"
                    onClick={() => handleQuickFilter('CONFIRMED')}
                >
                    Confirmados
                </Button>
                <Button 
                    variant={isFilterActive('Viajes') ? 'default' : 'secondary'} 
                    size="sm" 
                    className="h-7 text-xs rounded-full px-3"
                    onClick={() => handleQuickFilter('Viajes')}
                >
                    Viajes
                </Button>
                <Button 
                    variant={isFilterActive('USD') ? 'default' : 'secondary'} 
                    size="sm" 
                    className="h-7 text-xs rounded-full px-3"
                    onClick={() => handleQuickFilter('USD')}
                >
                    USD
                </Button>
                {hasAnyFilter && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs rounded-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setStatusFilter([]);
                            setSearchQuery("");
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete("status");
                            params.delete("query");
                            params.delete("currency");
                            router.push(`${pathname}?${params.toString()}`);
                        }}
                    >
                        Limpiar filtros
                    </Button>
                )}
            </div>
        </div>
    );
}
