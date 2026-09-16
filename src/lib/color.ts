/** Small hex color helpers used to derive a shade ramp from one admin-picked brand color. */

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function isHex6(v: string): boolean {
  return /^[0-9a-fA-F]{6}$/.test(v);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Mix `hex` toward `target` by `amount` (0 = unchanged, 1 = target). */
function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([
    r + (target[0] - r) * amount,
    g + (target[1] - g) * amount,
    b + (target[2] - b) * amount,
  ]);
}

export const lighten = (hex: string, amount: number) => mix(hex, [255, 255, 255], amount);
export const darken = (hex: string, amount: number) => mix(hex, [0, 0, 0], amount);

/** Derive the brand-50/500/600/700 ramp the theme expects from a single base color. */
export function brandRamp(baseHex: string) {
  const base = baseHex.startsWith("#") ? baseHex : `#${baseHex}`;
  return {
    50: lighten(base, 0.93),
    100: lighten(base, 0.83),
    500: base,
    600: darken(base, 0.14),
    700: darken(base, 0.26),
  };
}
