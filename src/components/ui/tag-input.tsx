"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  const handleUnselect = React.useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [onChange, value]
  );

  const addTag = React.useCallback(
    (raw: string) => {
      const newTag = raw.trim().toUpperCase();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInputValue("");
      // Keep focus so the user can keep adding tags.
      inputRef.current?.focus();
    },
    [onChange, value]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (inputValue === "" && value.length > 0) {
          onChange(value.slice(0, -1));
        }
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
      } else if (e.key === "Enter" && inputValue.trim() !== "") {
        e.preventDefault();
        addTag(inputValue);
      }
    },
    [value, onChange, addTag, inputValue]
  );

  // Suggestions not already selected, optionally filtered by what's typed.
  const query = inputValue.trim().toUpperCase();
  const selectables = suggestions.filter(
    (s) => !value.includes(s) && (query === "" || s.toUpperCase().includes(query))
  );

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled ? "opacity-50 cursor-not-allowed" : ""
        )}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
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
          ))}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            // Delay closing so a tap/click on a suggestion still registers.
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1 min-w-[120px]"
          />
        </div>
      </div>

      {open && selectables.length > 0 ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <div className="max-h-[145px] overflow-auto p-1">
            {selectables.map((tag) => (
              <button
                key={tag}
                type="button"
                // mousedown (not click) fires before the input blurs and
                // preventDefault keeps focus on the input, so the dropdown
                // stays open for multi-select. Covers mouse, touch and pen.
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(tag);
                }}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
