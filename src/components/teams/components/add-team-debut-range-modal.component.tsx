import { PlayerDatabaseWheelPicker, WHEEL_HEIGHT } from '@/components/player-database/components/player-database-wheel-picker.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

type AddTeamDebutRangeModalProps = {
  visible: boolean;
  years: number[];
  initialFrom: number | null;
  initialTo: number | null;
  yearFloor: number;
  yearCeiling: number;
  onApply: (from: number | null, to: number | null) => void;
  onDismiss: () => void;
};

const HEADER_AND_BUTTONS_HEIGHT = 220;

export function AddTeamDebutRangeModal({
  visible,
  years,
  initialFrom,
  initialTo,
  yearFloor,
  yearCeiling,
  onApply,
  onDismiss,
}: AddTeamDebutRangeModalProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<'from' | 'to'>('from');
  const [fromIndex, setFromIndex] = useState(() => Math.max(0, years.indexOf(initialFrom ?? yearFloor)));
  const [toIndex, setToIndex] = useState(() => Math.max(0, years.indexOf(initialTo ?? yearCeiling)));

  function handleShow() {
    setStep('from');
    setFromIndex(Math.max(0, years.indexOf(initialFrom ?? yearFloor)));
    setToIndex(Math.max(0, years.indexOf(initialTo ?? yearCeiling)));
  }

  function handleNext() {
    if (years[toIndex] < years[fromIndex]) {
      setToIndex(fromIndex);
    }
    setStep('to');
  }

  function handleApply() {
    onApply(years[fromIndex], years[toIndex]);
    onDismiss();
  }

  function handleClear() {
    onApply(null, null);
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
          <Text className="text-foreground mb-2 text-lg font-bold">{step === 'from' ? 'Debut Year — From' : 'Debut Year — To'}</Text>
          <Text variant="muted" className="mb-6 text-sm">
            Step {step === 'from' ? '1' : '2'} of 2
          </Text>

          <View style={{ height: WHEEL_HEIGHT }} className="items-center justify-center">
            <PlayerDatabaseWheelPicker
              values={years}
              selectedIndex={step === 'from' ? fromIndex : toIndex}
              onIndexChange={step === 'from' ? setFromIndex : setToIndex}
            />
          </View>

          <View className="flex-1" />

          <Pressable onPress={handleClear} className="mb-2 items-center rounded-sm py-2.5" style={{ backgroundColor: colors.muted }}>
            <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
              Clear Filter
            </Text>
          </Pressable>

          {step === 'from' ? (
            <Pressable onPress={handleNext} className="items-center rounded-sm py-3" style={{ backgroundColor: colors.level2 }}>
              <Text className="text-base font-semibold text-white">Next: To Year</Text>
            </Pressable>
          ) : (
            <View className="flex-row gap-2">
              <Pressable onPress={() => setStep('from')} className="flex-1 items-center rounded-sm py-3" style={{ backgroundColor: colors.muted }}>
                <Text style={{ color: colors.mutedForeground }} className="text-base font-semibold">
                  Back
                </Text>
              </Pressable>
              <Pressable onPress={handleApply} style={{ flex: 2, backgroundColor: colors.level2 }} className="items-center rounded-sm py-3">
                <Text className="text-base font-semibold text-white">Apply</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}