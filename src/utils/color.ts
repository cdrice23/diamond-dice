import { useTheme } from "./theme-provider";

export function adjustHslLightness(hsl: string, deltaPercent: number): string {
  const match = hsl.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
  if (!match) return hsl;

  const [, hue, saturation, lightness] = match;
  const newLightness = Math.max(0, Math.min(100, parseFloat(lightness) + deltaPercent));
  return `hsl(${hue} ${saturation}% ${newLightness}%)`;
}

type ColorScheme = 'light' | 'dark';

export function getShadeSequence(
  baseColor: string,
  count: number,
  colorScheme: ColorScheme,
  options?: { minAdjustPercent?: number; maxAdjustPercent?: number }
): string[] {
  const minAdjustPercent = options?.minAdjustPercent ?? 8;
  const maxAdjustPercent = options?.maxAdjustPercent ?? 26;
  const direction = colorScheme === 'dark' ? 1 : -1;

  return Array.from({ length: count }, (_, index) => {
    const t = count > 1 ? index / (count - 1) : 0;
    const easedT = Math.pow(t, 0.7);
    const magnitude = minAdjustPercent + easedT * (maxAdjustPercent - minAdjustPercent);
    return adjustHslLightness(baseColor, direction * magnitude);
  });
}

export function hslToTransparentHsla(hsl: string): string {
  const match = hsl.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
  if (!match) return hsl;

  const [, hue, saturation, lightness] = match;
  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`;
}

export function adjustHslAlpha(hsl: string, alpha: number): string {
  const match = hsl.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
  if (!match) return hsl;

  const [, hue, saturation, lightness] = match;
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${clampedAlpha})`;
}

function relativeLuminanceFromRgb(r: number, g: number, b: number): number {
  const toLinear = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function hexRelativeLuminance(hex: string): number {
  const match = hex.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  if (!match) return 0;

  const [r, g, b] = [match[1], match[2], match[3]].map((c) => parseInt(c, 16));
  return relativeLuminanceFromRgb(r, g, b);
}

export function hexContrastRatio(hexA: string, hexB: string): number {
  const lA = hexRelativeLuminance(hexA) + 0.05;
  const lB = hexRelativeLuminance(hexB) + 0.05;
  return lA > lB ? lA / lB : lB / lA;
}

function hslToRgb(hsl: string): [number, number, number] | null {
  const match = hsl.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
  if (!match) return null;

  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function relativeLuminance(color: string): number {
  const hexMatch = color.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  if (hexMatch) {
    const [r, g, b] = [hexMatch[1], hexMatch[2], hexMatch[3]].map((c) => parseInt(c, 16));
    return relativeLuminanceFromRgb(r, g, b);
  }

  const rgb = hslToRgb(color);
  if (rgb) return relativeLuminanceFromRgb(...rgb);

  return 0;
}

export function contrastRatio(colorA: string, colorB: string): number {
  const lA = relativeLuminance(colorA) + 0.05;
  const lB = relativeLuminance(colorB) + 0.05;
  return lA > lB ? lA / lB : lB / lA;
}

export const READABILITY_MIN_CONTRAST_RATIO = 4.5;
export const DECORATIVE_MIN_CONTRAST_RATIO = 3;

export function resolveTeamHeaderColors(
  primaryHex: string,
  secondaryHex: string
): { background: string; text: string } {
  if (hexContrastRatio(primaryHex, secondaryHex) >= READABILITY_MIN_CONTRAST_RATIO) {
    return { background: primaryHex, text: secondaryHex };
  }
  const blackContrast = hexContrastRatio(primaryHex, '#000000');
  const whiteContrast = hexContrastRatio(primaryHex, '#FFFFFF');
  return { background: primaryHex, text: blackContrast > whiteContrast ? '#000000' : '#FFFFFF' };
}

export type TeamColorResolution = {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
};

export function resolveTeamColors(primaryHex: string, secondaryHex: string, appBackgroundColor: string): TeamColorResolution {
  const primaryVsBg = contrastRatio(primaryHex, appBackgroundColor);
  const secondaryVsBg = contrastRatio(secondaryHex, appBackgroundColor);

  const backgroundColor = primaryVsBg >= secondaryVsBg ? primaryHex : secondaryHex;
  const remainingAccent = backgroundColor === primaryHex ? secondaryHex : primaryHex;
  const remainingVsBackground = contrastRatio(remainingAccent, backgroundColor);

  let textColor: string;
  if (remainingVsBackground >= READABILITY_MIN_CONTRAST_RATIO) {
    textColor = remainingAccent;
  } else {
    const blackContrast = contrastRatio(backgroundColor, '#000000');
    const whiteContrast = contrastRatio(backgroundColor, '#FFFFFF');
    textColor = blackContrast > whiteContrast ? '#000000' : '#FFFFFF';
  }

  const accentColor = colorDistance(remainingAccent, backgroundColor) >= DECORATIVE_MIN_COLOR_DISTANCE ? remainingAccent : textColor;

  return { backgroundColor, textColor, accentColor };
}

export function areTeamColorsTooSimilar(primaryHex: string, secondaryHex: string): boolean {
  return colorDistance(primaryHex, secondaryHex) < DECORATIVE_MIN_COLOR_DISTANCE;
}

export function blendHsl(base: string, tint: string, tintOpacity: number): string {
  const baseMatch = base.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
  if (!baseMatch) return base;
  const [, baseH, baseS, baseL] = baseMatch.map(Number);

  const tintHexMatch = tint.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  if (!tintHexMatch) return base;
  const [tr, tg, tb] = [tintHexMatch[1], tintHexMatch[2], tintHexMatch[3]].map((c) => parseInt(c, 16));

  const c = (1 - Math.abs((2 * baseL) / 100 - 1)) * (baseS / 100);
  const x = c * (1 - Math.abs(((baseH / 60) % 2) - 1));
  const m = baseL / 100 - c / 2;
  let [br, bg, bb] = [0, 0, 0];
  if (baseH < 60) [br, bg, bb] = [c, x, 0];
  else if (baseH < 120) [br, bg, bb] = [x, c, 0];
  else if (baseH < 180) [br, bg, bb] = [0, c, x];
  else if (baseH < 240) [br, bg, bb] = [0, x, c];
  else if (baseH < 300) [br, bg, bb] = [x, 0, c];
  else [br, bg, bb] = [c, 0, x];
  [br, bg, bb] = [(br + m) * 255, (bg + m) * 255, (bb + m) * 255];

  const r = Math.round(br * (1 - tintOpacity) + tr * tintOpacity);
  const g = Math.round(bg * (1 - tintOpacity) + tg * tintOpacity);
  const b = Math.round(bb * (1 - tintOpacity) + tb * tintOpacity);

  return `rgb(${r}, ${g}, ${b})`;
}

export function levelColor(level: number | null, colors: ReturnType<typeof useTheme>['colors']): string {
  if (level === 1) return colors.level1;
  if (level === 2) return colors.level2;
  if (level === 3) return colors.level3;
  return colors.muted;
}

type LabColor = { L: number; a: number; b: number };

function hexToLinearRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  if (!match) return null;

  const toLinear = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const [r, g, b] = [match[1], match[2], match[3]].map((c) => toLinear(parseInt(c, 16)));
  return [r, g, b];
}

const D65_WHITE = { x: 0.95047, y: 1.0, z: 1.08883 };

function hexToLab(hex: string): LabColor | null {
  const linear = hexToLinearRgb(hex);
  if (!linear) return null;
  const [r, g, b] = linear;

  const x = 0.4124 * r + 0.3576 * g + 0.1805 * b;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = 0.0193 * r + 0.1192 * g + 0.9505 * b;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / D65_WHITE.x);
  const fy = f(y / D65_WHITE.y);
  const fz = f(z / D65_WHITE.z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function colorDistance(hexA: string, hexB: string): number {
  const labA = hexToLab(hexA);
  const labB = hexToLab(hexB);
  if (!labA || !labB) return 0;

  return Math.sqrt((labA.L - labB.L) ** 2 + (labA.a - labB.a) ** 2 + (labA.b - labB.b) ** 2);
}

export const DECORATIVE_MIN_COLOR_DISTANCE = 25;