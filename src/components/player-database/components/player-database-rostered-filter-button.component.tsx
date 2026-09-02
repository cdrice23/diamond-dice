import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { NEUTRAL_FILTER_COLOR, NEUTRAL_FILTER_COLOR_MUTED } from '@/components/player-database/player-database.constants';
import { useTheme } from '@/utils/theme-provider';
import { PlayerDatabaseFilterChipButton } from './player-database-filter-chip-button.component';

type PlayerDatabaseRosteredFilterButtonProps = {
  value: boolean;
  onChange: (next: boolean) => void;
};

export function PlayerDatabaseRosteredFilterButton({ value, onChange }: PlayerDatabaseRosteredFilterButtonProps) {
  const { colorScheme, colors } = useTheme();

  return (
    <PlayerDatabaseFilterChipButton
      label="Used In Roster"
      isActive={value}
      activeColor={NEUTRAL_FILTER_COLOR[colorScheme]}
      onPress={() => onChange(!value)}
      accessibilityLabel={`On my roster filter, currently ${value ? 'on' : 'off'}`}
      leading={<PixelIcon name="jersey" size={14} color={value ? colors.primary : NEUTRAL_FILTER_COLOR[colorScheme]} />}
      inactiveBackgroundColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
      inactiveBorderColor={NEUTRAL_FILTER_COLOR_MUTED[colorScheme]}
    />
  );
}