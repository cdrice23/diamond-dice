import { View } from 'react-native';

export type StatBarSegment = {
  percent: number;
  color: string;
};

type ProfileStatBarProps = {
  segments: StatBarSegment[];
  fillerColor?: string;
};

export function ProfileStatBar({ segments, fillerColor }: ProfileStatBarProps) {
  const namedTotal = segments.reduce((sum, segment) => sum + segment.percent, 0);
  const fillerPercent = fillerColor ? Math.max(0, 1 - namedTotal) : 0;

  return (
    <View className="h-1 flex-row overflow-hidden rounded-none">
      {segments.map((segment, index) => (
        <View key={index} style={{ width: `${segment.percent * 100}%`, backgroundColor: segment.color }} />
      ))}
      {fillerPercent > 0 && <View style={{ width: `${fillerPercent * 100}%`, backgroundColor: fillerColor }} />}
    </View>
  );
}