"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimeStepInputProps {
    /** Wall-clock value as `YYYY-MM-DDTHH:mm`, same shape a native datetime-local input uses. */
    value: string;
    onChange: (value: string) => void;
    /** Minute increment offered in the minute dropdown. Defaults to 5. */
    minuteStep?: number;
    id?: string;
    required?: boolean;
}

function splitValue(value: string): { date: string; hour: string; minute: string } {
    const [datePart = "", timePart = ""] = value.split("T");
    const [hour = "00", minute = "00"] = timePart.split(":");
    return { date: datePart, hour, minute };
}

const selectClassName =
    "h-10 appearance-none rounded-lg border border-border-base bg-bg-primary pl-3 pr-7 text-sm text-text-primary outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20";

/**
 * Date + time picker whose minute choices are constrained to a fixed step
 * (5 minutes by default). Native `<input type="datetime-local" step="...">`
 * doesn't reliably restrict the minute wheel on mobile browsers, so hour and
 * minute are rendered as plain `<select>`s instead, guaranteeing the step
 * everywhere. Reads/writes the same `YYYY-MM-DDTHH:mm` string a datetime-local
 * input would, so it's a drop-in replacement.
 */
export function DateTimeStepInput({ value, onChange, minuteStep = 5, id, required }: DateTimeStepInputProps) {
    const { date, hour, minute } = splitValue(value);

    const commit = (nextDate: string, nextHour: string, nextMinute: string) => {
        onChange(nextDate ? `${nextDate}T${nextHour}:${nextMinute}` : "");
    };

    const hours = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
    const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => String(i * minuteStep).padStart(2, "0"));

    return (
        <div className="flex items-center gap-2">
            <input
                id={id}
                type="date"
                required={required}
                value={date}
                onChange={(e) => commit(e.target.value, hour, minute)}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border-base bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
            />
            <div className="relative shrink-0">
                <select
                    aria-label="Hora"
                    value={hour}
                    onChange={(e) => commit(date, e.target.value, minute)}
                    className={cn(selectClassName, "w-[4.5rem]")}
                >
                    {hours.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            </div>
            <span className="shrink-0 text-text-tertiary">:</span>
            <div className="relative shrink-0">
                <select
                    aria-label="Minuto"
                    value={minute}
                    onChange={(e) => commit(date, hour, e.target.value)}
                    className={cn(selectClassName, "w-[4.5rem]")}
                >
                    {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            </div>
        </div>
    );
}
