import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes guest names for consistent database matching and lookup:
 * - Trims leading/trailing whitespace
 * - Converts multiple inner spaces to single space
 * - Lowercases characters
 * - Strips accent diacritics where appropriate
 */
export function normalizeName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Capitalizes a guest name for display (e.g. "BECCA" -> "Becca", "van der bilt" -> "Van Der Bilt")
 */
export function formatGuestName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
