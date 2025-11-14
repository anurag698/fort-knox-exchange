
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0,
      g = 0,
      b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  // Having obtained RGB, convert channels to hex
  let r_hex = Math.round((r + m) * 255).toString(16);
  let g_hex = Math.round((g + m) * 255).toString(16);
  let b_hex = Math.round((b + m) * 255).toString(16);

  if (r_hex.length == 1)
    r_hex = "0" + r_hex;
  if (g_hex.length == 1)
    g_hex = "0" + g_hex;
  if (b_hex.length == 1)
    b_hex = "0" + b_hex;

  return "#" + r_hex + g_hex + b_hex;
}

/**
 * Gets a computed CSS variable from the document root and returns it as a Hex color string.
 * @param varName The name of the CSS variable (e.g., '--primary').
 * @returns The computed color value as a Hex string (e.g., '#ffffff').
 */
export function getThemeColor(varName: string): string {
    if (typeof window === 'undefined') {
        // Return a default/fallback color for SSR
        if (varName.includes('foreground')) return '#f8fafc';
        if (varName.includes('border')) return '#3f3f46';
        return '#09090b';
    }

    const hslValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (!hslValue) {
      console.warn(`CSS variable ${varName} not found.`);
      return '#000000';
    }

    const [h, s, l] = hslValue.split(' ').map(val => parseFloat(val.replace('%', '')));
    if (isNaN(h) || isNaN(s) || isNaN(l)) {
      console.warn(`Could not parse HSL value for ${varName}: ${hslValue}`);
      return '#000000';
    }

    return hslToHex(h, s, l);
}
