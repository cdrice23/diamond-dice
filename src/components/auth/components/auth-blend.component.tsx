import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

type AuthBlendProps = {
  anchorY: number;
  solidHeight: number;
  screenHeight: number;
  color: string;
  fadeFraction?: number;
};

function withAlpha(color: string, alpha: number): string {
  const hexMatch = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const rgbMatch = color.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]},${alpha})`;
  }
  const hslSpaceMatch = color.match(/^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/);
  if (hslSpaceMatch) {
    const [, h, s, l] = hslSpaceMatch;
    return `hsla(${h},${s}%,${l}%,${alpha})`;
  }
  const hslCommaMatch = color.match(/^hsla?\(\s*([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%/);
  if (hslCommaMatch) {
    const [, h, s, l] = hslCommaMatch;
    return `hsla(${h},${s}%,${l}%,${alpha})`;
  }

  return alpha === 0 ? 'transparent' : color;
}

export function AuthBlend({ anchorY, solidHeight, screenHeight, color, fadeFraction = 0.2 }: AuthBlendProps) {
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const effectiveHeight = measuredHeight > 0 ? measuredHeight : screenHeight;

  function handleLayout(e: LayoutChangeEvent) {
    const h = e.nativeEvent.layout.height;
    if (h !== measuredHeight) setMeasuredHeight(h);
  }

  if (effectiveHeight <= 0) {
    return <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onLayout={handleLayout} pointerEvents="none" />;
  }

  const solidTop = Math.max(0, anchorY);
  const solidBottom = Math.min(effectiveHeight, anchorY + solidHeight);

  const topGap = solidTop;
  const bottomGap = effectiveHeight - solidBottom;

  const topFadeStart = Math.max(0, solidTop - topGap * fadeFraction);
  const bottomFadeEnd = Math.min(effectiveHeight, solidBottom + bottomGap * fadeFraction);

  const raw = [0, topFadeStart, solidTop, solidBottom, bottomFadeEnd, effectiveHeight];
  const fixed: number[] = [];
  for (const v of raw) {
    const frac = v / effectiveHeight;
    fixed.push(fixed.length > 0 ? Math.max(frac, fixed[fixed.length - 1] + 0.0001) : frac);
  }
  const locations = fixed.map((f) => Math.min(1, f)) as [number, number, number, number, number, number];

  const transparentColor = withAlpha(color, 0);
  const opaqueColor = withAlpha(color, 1);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onLayout={handleLayout} pointerEvents="none">
      <LinearGradient
        colors={[transparentColor, transparentColor, opaqueColor, opaqueColor, transparentColor, transparentColor]}
        locations={locations}
        style={{ flex: 1 }}
      />
    </View>
  );
}