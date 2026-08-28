import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

type TeamDetailCardHeaderProps = {
  label: string;
  bandColor: string;
  textColor: string;
};

export function TeamDetailCardHeader({ label, bandColor, textColor }: TeamDetailCardHeaderProps) {
  return (
    <View style={{ backgroundColor: bandColor }} className="-mx-4 -mt-4 mb-4 flex-row items-center gap-2.5 rounded-t-lg px-4 py-3">
      <View style={{ width: 5, height: 22, borderRadius: 2.5, backgroundColor: textColor }} />
      <Text style={{ color: textColor, letterSpacing: 1.2 }} className="text-xl font-extrabold uppercase">
        {label}
      </Text>
    </View>
  );
}