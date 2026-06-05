"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    id?: string;
    className?: string;
}

export function AutocompleteInput({ value, onChange, options, placeholder, id, className }: AutocompleteInputProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);

    // Sync input value with external value prop
    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val);
        setOpen(true);
    };

    const handleSelect = (selectedValue: string) => {
        setInputValue(selectedValue);
        onChange(selectedValue);
        setOpen(false);
    };

    // Filter options based on input value
    const filteredOptions = React.useMemo(() => {
        if (!inputValue) return options;
        const lowerVal = inputValue.toLowerCase();
        return options.filter(opt => opt.toLowerCase().includes(lowerVal));
    }, [inputValue, options]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-full">
                    <Input
                        id={id}
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        className={cn("w-full bg-background border-border/50", className)}
                        autoComplete="off"
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] p-1 overflow-hidden" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="max-h-[300px] overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No se encontraron resultados
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {filteredOptions.map((opt, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(opt)}
                                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
