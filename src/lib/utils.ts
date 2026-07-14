import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Move the currently-selected item (matched by name, case-insensitive) to the front of the list. */
export function withSelectedFirst<T extends { name: string }>(list: T[], selectedName: string): T[] {
  if (!selectedName) return list;
  const idx = list.findIndex((item) => item.name.trim().toLowerCase() === selectedName.trim().toLowerCase());
  if (idx <= 0) return list;
  const copy = list.slice();
  const [selected] = copy.splice(idx, 1);
  copy.unshift(selected);
  return copy;
}
