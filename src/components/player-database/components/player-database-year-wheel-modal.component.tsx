import { PlayerDatabaseWheelPicker, WHEEL_HEIGHT } from '@/components/player-database/components/player-database-wheel-picker.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

type PlayerDatabaseYearWheelModalProps = {
  visible: boolean;
  title: string;
  years: number[];
  selectedYear: number;
  onApply: (year: number | null) => void;
  onDismiss: () => void;
};

const HEADER_AND_BUTTONS_HEIGHT = 220;

export function PlayerDatabaseYearWheelModal({
  visible,
  title,
  years,
  selectedYear,
  onApply,
  onDismiss,
}: PlayerDatabaseYearWheelModalProps) {
  const { colors } = useTheme();
  const [draftIndex, setDraftIndex] = useState(() => Math.max(0, years.indexOf(selectedYear)));

  function handleShow() {
    setDraftIndex(Math.max(0, years.indexOf(selectedYear)));
  }

  function handleApply() {
    onApply(years[draftIndex]);
    onDismiss();
  }

  function handleClear() {
    onApply(null);
    onDismiss();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss} onShow={handleShow}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onDismiss}>
        <Pressable
          className="bg-background rounded-t-2xl p-4 pb-10"
          style={{ height: WHEEL_HEIGHT + HEADER_AND_BUTTONS_HEIGHT }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-foreground mb-8 text-lg font-bold">{title}</Text>

          <View style={{ height: WHEEL_HEIGHT }} className="items-center justify-center">
            <PlayerDatabaseWheelPicker values={years} selectedIndex={draftIndex} onIndexChange={setDraftIndex} />
          </View>

          <View className="flex-1" />

          <Pressable onPress={handleClear} className="mb-2 items-center rounded-md py-2.5" style={{ backgroundColor: colors.muted }}>
            <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
              Clear Filter
            </Text>
          </Pressable>

          <Pressable onPress={handleApply} className="items-center rounded-md py-3" style={{ backgroundColor: colors.level2 }}>
            <Text className="font-semibold text-white">Apply</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}