
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets a computed CSS variable from the document root and formats it for use in libraries.
 * @param varName The name of the CSS variable (e.g., '--primary').
 * @returns The computed color value, formatted as a comma-separated hsl string.
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
    // The browser returns HSL values with spaces. lightweight-charts needs commas.
    const commaSeparatedHsl = hslValue.replace(/\s+/g, ', ');
    return `hsl(${commaSeparatedHsl})`;
}
