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