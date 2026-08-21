import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { NEUTRAL_FILTER_COLOR, NEUTRAL_FILTER_COLOR_MUTED } from '@/components/player-database/player-database.constants';
import type { PlayerType } from '@/components/player-database/player-database.types';
import { useTheme } from '@/utils/theme-provider';
import { View } from 'react-native';
import { PlayerDatabaseFilterChipButton } from './player-database-filter-chip-button.component';

type PlayerDatabasePlayerTypeFilterButtonProps = {
  value: PlayerType;
  onChange: (next: PlayerType) => void;
};

const CYCLE_ORDER: PlayerType[] = [null, 'batter', 'pitcher'];
const LABELS: Record<'null' | 'batter' | 'pitcher', string> = { null: 'All', batter: 'Batter', pitcher: 'Pitcher' };
const ICON_SIZE = 14;

function labelKey(value: PlayerType): 'null' | 'batter' | 'pitcher' {
  return value === null ? 'null' : value;
}

export function PlayerDatabasePlayerTypeFilterButton({ value, onChange }: PlayerDatabasePlayerTypeFilterButtonProps) {
  const { colorScheme, colors } = useTheme();

  function handlePress() {
    const currentIndex = CYCLE_ORDER.indexOf(value);
    onChange(CYCLE_ORDER[(currentIndex + 1) % CYCLE_ORDER.length]);
  }

  const isActive = value !== null;
  const iconColor = isActive ? '#FFFFFF' : colors.foreground;

  const icons =
    value === 'batter' ? (
      <PixelIcon name="bat" size={ICON_SIZE} color={iconColor} />
    ) : value === 'pitcher' ? (
      <PixelIcon name="baseball" size={ICON_SIZE} color={iconColor} />
    ) : (
      <View className="flex-row gap-0.5">
        <PixelIcon name="bat" size={ICON_SIZE} color={iconColor} />
        <PixelIcon name="baseball" size={ICON_SIZE} color={iconColor} />
      </View>
    );

  return (
    <PlayerDatabaseFilterChipButton
      label={LABELS[labelKey(value)]}
      isActive={isActive}
      activeColor={NEUTRAL_FILTER_COLOR[colorScheme]}
      onPress={handlePress}
      accessibilityLabel={`Player type filter, currently ${LABELS[labelKey(value)]}`}
      leading={icons}
      inactiveBackgroundColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
      inactiveBorderColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
    />
  );
}