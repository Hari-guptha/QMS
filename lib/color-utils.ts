/**
 * Color utility functions for theme customization
 */

/**
 * Converts hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Lightens a color by a percentage
 */
export function lightenColor(hex: string, percent: number = 10): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 + percent / 100;
  const r = Math.min(255, rgb.r * factor);
  const g = Math.min(255, rgb.g * factor);
  const b = Math.min(255, rgb.b * factor);

  return rgbToHex(r, g, b);
}

/**
 * Darkens a color by a percentage
 */
export function darkenColor(hex: string, percent: number = 10): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const r = Math.max(0, rgb.r * factor);
  const g = Math.max(0, rgb.g * factor);
  const b = Math.max(0, rgb.b * factor);

  return rgbToHex(r, g, b);
}

/**
 * Applies a primary color to the CSS variables
 */
export function applyPrimaryColor(color: string) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--primary', color);
  
  // Generate and apply variants
  const lightVariant = lightenColor(color, 10);
  const darkVariant = darkenColor(color, 10);
  
  root.style.setProperty('--primary-light', lightVariant);
  root.style.setProperty('--primary-dark', darkVariant);
}

/**
 * Color presets for primary color selection
 */
export const COLOR_PRESETS = [
  { name: 'Blue', value: '#3b82f6', description: 'Classic blue theme' },
  { name: 'Green', value: '#22c55e', description: 'Fresh green theme' },
  { name: 'Purple', value: '#8b5cf6', description: 'Royal purple theme' },
  { name: 'Pink', value: '#ec4899', description: 'Vibrant pink theme' },
  { name: 'Yellow', value: '#eab308', description: 'Bright yellow theme' },
  { name: 'Indigo', value: '#6366f1', description: 'Deep indigo theme' },
  { name: 'Red', value: '#ef4444', description: 'Bold red theme' },
  { name: 'Orange', value: '#f97316', description: 'Energetic orange theme' },
  { name: 'Teal', value: '#14b8a6', description: 'Calm teal theme' },
  { name: 'Slate', value: '#64748b', description: 'Professional slate theme' },
] as const;

/**
 * Default primary color
 */
export const DEFAULT_PRIMARY_COLOR = '#3b82f6';

