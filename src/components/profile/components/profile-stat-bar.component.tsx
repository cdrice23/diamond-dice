import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

export type StatBarSegment = {
  label: string;
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

  let cumulative = 0;
  const startPositions = segments.map((segment) => {
    const start = cumulative;
    cumulative += segment.percent;
    return start;
  });

  return (
    <View>
      <View className="h-1.5 flex-row overflow-hidden rounded-[3px]">
        {segments.map((segment, index) => (
          <View key={index} style={{ width: `${segment.percent * 100}%`, backgroundColor: segment.color }} />
        ))}
        {fillerPercent > 0 && <View style={{ width: `${fillerPercent * 100}%`, backgroundColor: fillerColor }} />}
      </View>
      <View className="relative mt-1.5 h-8">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <View
              key={index}
              style={
                isLast
                  ? { position: 'absolute', right: 0, alignItems: 'flex-end' }
                  : { position: 'absolute', left: `${startPositions[index] * 100}%`, alignItems: 'flex-start' }
              }
            >
              <Text variant="muted" className="text-xs">
                {segment.label} {(segment.percent * 100).toFixed(0)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}