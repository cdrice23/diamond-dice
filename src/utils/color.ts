export function adjustHslLightness(hsl: string, deltaPercent: number): string {
  const match = hsl.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
  if (!match) return hsl;

  const [, hue, saturation, lightness] = match;
  const newLightness = Math.max(0, Math.min(100, parseFloat(lightness) + deltaPercent));
  return `hsl(${hue} ${saturation}% ${newLightness}%)`;
}