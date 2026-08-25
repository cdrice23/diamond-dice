import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

type PlayerDetailBioCardProps = {
  player: PlayerDetail;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}

function formatHandedness(value: string | null): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function BioRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text variant="muted" className="text-lg">
        {label}
      </Text>
      <Text className="text-foreground text-lg font-semibold">{value}</Text>
    </View>
  );
}

export function PlayerDetailBioCard({ player }: PlayerDetailBioCardProps) {
  const birthdayDisplay = player.birthday
    ? player.active
      ? `${formatDate(player.birthday)} (${calculateAge(player.birthday)})`
      : formatDate(player.birthday)
    : '—';

  return (
    <Card className="mx-4">
      <CardSectionHeader label="Bio" />

      <View className="gap-2.5">
        {player.nickname && <BioRow label="Nickname" value={player.nickname} />}
        <BioRow label="Hometown" value={player.hometown ?? '—'} />
        <BioRow label="Born" value={birthdayDisplay} />
        <BioRow label="MLB Debut" value={formatDate(player.mlb_debut_date)} />
        <BioRow label="Bats" value={formatHandedness(player.bats)} />
        <BioRow label="Throws" value={formatHandedness(player.throws)} />
      </View>
    </Card>
  );
}