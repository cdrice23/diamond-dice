import { Text } from '@/components/primitives/text.component';
import { Pressable, View } from 'react-native';

type AddTeamColorSwatchProps = {
  label: string;
  color: string | null;
  onPress: () => void;
};

export function AddTeamColorSwatch({ label, color, onPress }: AddTeamColorSwatchProps) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center gap-2 active:opacity-70">
      <View
        className="border-border h-16 w-16 rounded-full border-2"
        style={{ backgroundColor: color ?? 'transparent' }}
      />
      <Text variant="muted" className="text-sm font-semibold">
        {label}
      </Text>
    </Pressable>
  );
}