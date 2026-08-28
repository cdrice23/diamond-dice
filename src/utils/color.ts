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