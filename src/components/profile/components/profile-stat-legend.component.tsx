import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

export type StatLegendItem = {
  label: string;
  value: string;
  color: string;
};

type ProfileStatLegendProps = {
  items: StatLegendItem[];
};

export function ProfileStatLegend({ items }: ProfileStatLegendProps) {
  return (
    <View className="mt-4 flex-row flex-wrap">
      {items.map((item, index) => (
        <View key={index} style={{ flexBasis: `${100 / items.length}%` }} className="items-center px-0.5 py-1">
          <View className="flex-row items-center gap-1 mb-1">
            <View style={{ backgroundColor: item.color }} className="h-2 w-2 rounded-full" />
            <Text variant="muted" className="text-[12px]">
              {item.label}
            </Text>
          </View>
          <Text className="text-foreground text-md font-semibold">{item.value}</Text>
        </View>
      ))}
    </View>
  );
}