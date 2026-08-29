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

function hexRelativeLuminance(hex: string): number {
  const match = hex.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  if (!match) return 0;

  const [r, g, b] = [match[1], match[2], match[3]].map((c) => parseInt(c, 16) / 255);
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function hexContrastRatio(hexA: string, hexB: string): number {
  const lA = hexRelativeLuminance(hexA) + 0.05;
  const lB = hexRelativeLuminance(hexB) + 0.05;
  return lA > lB ? lA / lB : lB / lA;
}

const WCAG_AA_NORMAL_TEXT_MIN_RATIO = 4.5;

export function resolveTeamHeaderColors(
  primaryHex: string,
  secondaryHex: string
): { background: string; text: string } {
  if (hexContrastRatio(primaryHex, secondaryHex) >= WCAG_AA_NORMAL_TEXT_MIN_RATIO) {
    return { background: primaryHex, text: secondaryHex };
  }
  const blackContrast = hexContrastRatio(primaryHex, '#000000');
  const whiteContrast = hexContrastRatio(primaryHex, '#FFFFFF');
  return { background: primaryHex, text: blackContrast > whiteContrast ? '#000000' : '#FFFFFF' };
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