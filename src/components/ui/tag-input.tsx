"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tags...",
  disabled,
  className,
}: TagInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback((tag: string) => {
    onChange(value.filter((t) => t !== tag));
  }, [onChange, value]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }
        if (e.key === "Escape") {
          input.blur();
        }
        if (e.key === "Enter" && input.value.trim() !== "") {
          e.preventDefault();
          const newTag = input.value.trim().toUpperCase();
          if (!value.includes(newTag)) {
            onChange([...value, newTag]);
          }
          setInputValue("");
        }
      }
    },
    [value, onChange]
  );

  const selectables = suggestions.filter((s) => !value.includes(s));

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn("overflow-visible bg-transparent", className)}
    >
      <div
        className={cn(
          "group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled ? "opacity-50 cursor-not-allowed" : ""
        )}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => {
            return (
              <Badge key={tag} variant="outline" className="hover:bg-secondary">
                {tag}
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(tag);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(tag)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1 min-w-[120px]"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && selectables.length > 0 ? (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
            <CommandList>
              <CommandGroup className="h-full overflow-auto max-h-[145px]">
                {selectables.map((tag) => {
                  return (
                    <CommandItem
                      key={tag}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={(val) => {
                        setInputValue("");
                        const newTag = tag.toUpperCase();
                        if (!value.includes(newTag)) {
                          onChange([...value, newTag]);
                        }
                      }}
                      className={"cursor-pointer"}
                    >
                      {tag}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </div>
        ) : null}
      </div>
    </Command>
  );
}
