import { Text } from '@/components/primitives/text.component';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type TeamDetailCardHeaderProps = {
  label: string;
  bandColor: string;
  textColor: string;
  accentColor?: string;
  action?: ReactNode;
};

export function TeamDetailCardHeader({ label, bandColor, textColor, accentColor, action }: TeamDetailCardHeaderProps) {
  return (
    <View style={{ backgroundColor: bandColor }} className="-mx-4 -mt-4 mb-4 flex-row items-center justify-between rounded-t-lg px-4 py-3">
      <View className="flex-row items-center gap-2.5">
        <View style={{ width: 5, height: 22, borderRadius: 2.5, backgroundColor: accentColor ?? textColor }} />
        <Text style={{ color: textColor, letterSpacing: 1.2 }} className="text-xl font-extrabold uppercase">
          {label}
        </Text>
      </View>
      {action}
    </View>
  );
}