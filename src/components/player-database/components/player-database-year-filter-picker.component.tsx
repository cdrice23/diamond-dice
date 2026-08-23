import { PlayerDatabaseWheelPicker } from '@/components/player-database/components/player-database-wheel-picker.component';
import { DEBUT_YEAR_CEILING, DEBUT_YEAR_FLOOR } from '@/components/player-database/player-database.constants';
import { Text } from '@/components/primitives/text.component';
import { useMemo } from 'react';
import { View } from 'react-native';

type PlayerDatabaseYearFilterPickerProps = {
  yearFrom: number | null;
  yearTo: number | null;
  onChange: (yearFrom: number | null, yearTo: number | null) => void;
};

export function PlayerDatabaseYearFilterPicker({ yearFrom, yearTo, onChange }: PlayerDatabaseYearFilterPickerProps) {
  const years = useMemo(() => {
    const list: number[] = [];
    for (let year = DEBUT_YEAR_FLOOR; year <= DEBUT_YEAR_CEILING; year++) {
      list.push(year);
    }
    return list;
  }, []);

  const resolvedFrom = yearFrom ?? DEBUT_YEAR_FLOOR;
  const resolvedTo = yearTo ?? DEBUT_YEAR_CEILING;

  const fromIndex = years.indexOf(resolvedFrom);
  const toIndex = years.indexOf(resolvedTo);

  function handleFromIndexChange(index: number) {
    const nextFrom = years[index];
    const clampedFrom = Math.min(nextFrom, resolvedTo);
    onChange(clampedFrom === DEBUT_YEAR_FLOOR ? null : clampedFrom, resolvedTo === DEBUT_YEAR_CEILING ? null : resolvedTo);
  }

  function handleToIndexChange(index: number) {
    const nextTo = years[index];
    const clampedTo = Math.max(nextTo, resolvedFrom);
    onChange(resolvedFrom === DEBUT_YEAR_FLOOR ? null : resolvedFrom, clampedTo === DEBUT_YEAR_CEILING ? null : clampedTo);
  }

  return (
    <View>
      <Text className="text-foreground mb-2 text-base font-semibold">Debut Year</Text>

      <View className="flex-row items-center">
        <View className="flex-1 items-center">
          <Text variant="muted" className="mb-1 text-xs">
            From
          </Text>
          <PlayerDatabaseWheelPicker values={years} selectedIndex={fromIndex} onIndexChange={handleFromIndexChange} />
        </View>

        <Text variant="muted" className="px-2">
          to
        </Text>

        <View className="flex-1 items-center">
          <Text variant="muted" className="mb-1 text-xs">
            To
          </Text>
          <PlayerDatabaseWheelPicker values={years} selectedIndex={toIndex} onIndexChange={handleToIndexChange} />
        </View>
      </View>
    </View>
  );
}