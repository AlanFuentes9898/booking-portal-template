import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely. shadcn/ui standard helper. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
