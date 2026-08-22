import { DEBUT_YEAR_CEILING, DEBUT_YEAR_FLOOR } from '@/components/player-database/player-database.constants';
import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { RangeSlider } from '@react-native-assets/slider';
import { useState } from 'react';
import { View } from 'react-native';

type PlayerDatabaseYearFilterSliderProps = {
  yearFrom: number | null;
  yearTo: number | null;
  onChange: (yearFrom: number | null, yearTo: number | null) => void;
  onInputFocus?: () => void;
};

function clampYear(year: number): number {
  return Math.max(DEBUT_YEAR_FLOOR, Math.min(DEBUT_YEAR_CEILING, year));
}

export function PlayerDatabaseYearFilterSlider({ yearFrom, yearTo, onChange, onInputFocus }: PlayerDatabaseYearFilterSliderProps) {
  const { colors } = useTheme();

  const resolvedFrom = yearFrom ?? DEBUT_YEAR_FLOOR;
  const resolvedTo = yearTo ?? DEBUT_YEAR_CEILING;

  const [fromText, setFromText] = useState(String(resolvedFrom));
  const [toText, setToText] = useState(String(resolvedTo));

  function handleSliderChange(range: [number, number]) {
    const [nextFrom, nextTo] = range;
    setFromText(String(nextFrom));
    setToText(String(nextTo));
    onChange(nextFrom === DEBUT_YEAR_FLOOR ? null : nextFrom, nextTo === DEBUT_YEAR_CEILING ? null : nextTo);
  }

  function commitFromText(text: string) {
    const parsed = parseInt(text, 10);
    if (Number.isNaN(parsed)) {
      setFromText(String(resolvedFrom));
      return;
    }
    const clamped = Math.min(clampYear(parsed), resolvedTo);
    setFromText(String(clamped));
    onChange(clamped === DEBUT_YEAR_FLOOR ? null : clamped, resolvedTo === DEBUT_YEAR_CEILING ? null : resolvedTo);
  }

  function commitToText(text: string) {
    const parsed = parseInt(text, 10);
    if (Number.isNaN(parsed)) {
      setToText(String(resolvedTo));
      return;
    }
    const clamped = Math.max(clampYear(parsed), resolvedFrom);
    setToText(String(clamped));
    onChange(resolvedFrom === DEBUT_YEAR_FLOOR ? null : resolvedFrom, clamped === DEBUT_YEAR_CEILING ? null : clamped);
  }

  return (
    <View>
      <Text className="text-foreground mb-2 text-base font-semibold">Debut Year</Text>

      <View className="px-4">
        <RangeSlider
          range={[resolvedFrom, resolvedTo]}
          minimumValue={DEBUT_YEAR_FLOOR}
          maximumValue={DEBUT_YEAR_CEILING}
          step={1}
          onValueChange={handleSliderChange}
          outboundColor={colors.muted}
          inboundColor={colors.level2}
          thumbTintColor={colors.primary}
          thumbSize={26}
        />
      </View>

      <View className="mt-2 flex-row items-center gap-3">
        <View className="flex-1">
          <Text variant="muted" className="mb-1 text-xs">
            From
          </Text>
          <Input
            value={fromText}
            onChangeText={setFromText}
            onBlur={() => commitFromText(fromText)}
            onSubmitEditing={() => commitFromText(fromText)}
            onFocus={onInputFocus}
            keyboardType="numeric"
            returnKeyType="done"
            maxLength={4}
          />
        </View>
        <Text variant="muted" className="mt-4">
          to
        </Text>
        <View className="flex-1">
          <Text variant="muted" className="mb-1 text-xs">
            To
          </Text>
          <Input
            value={fromText}
            onChangeText={setFromText}
            onBlur={() => commitFromText(fromText)}
            onSubmitEditing={() => commitFromText(fromText)}
            onFocus={onInputFocus}
            keyboardType="numeric"
            returnKeyType="done"
            maxLength={4}
          />
        </View>
      </View>
    </View>
  );
}