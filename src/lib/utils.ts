import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets a computed CSS variable from the document root.
 * @param varName The name of the CSS variable (e.g., '--primary').
 * @returns The computed color value (e.g., '240 5.9% 10%').
 */
export function getThemeColor(varName: string): string {
    if (typeof window === 'undefined') {
        // Return a default/fallback color for SSR
        if (varName.includes('foreground')) return '#f8fafc'; // light gray
        if (varName.includes('border')) return '#3f3f46'; // dark gray
        return '#09090b'; // black
    }
    const hslValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (!hslValue) {
      console.warn(`CSS variable ${varName} not found.`);
      return '#000000';
    }
    // lightweight-charts wants a hex/rgb value, not the HSL components string
    // This is a simple approximation. For full accuracy, a HSL to Hex converter would be needed.
    // However, modern browsers often compute the value directly.
    return `hsl(${hslValue})`;
}
