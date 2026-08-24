import type { PlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
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

function BioRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-3">
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
      <Text className="text-foreground mb-2 text-xl font-semibold">Bio</Text>

      {player.nickname && (
        <View className="border-border border-t">
          <BioRow label="Nickname" value={player.nickname} />
        </View>
      )}
      <View className="border-border border-t">
        <BioRow label="Hometown" value={player.hometown ?? '—'} />
      </View>
      <View className="border-border border-t">
        <BioRow label="Born" value={birthdayDisplay} />
      </View>
      <View className="border-border border-t">
        <BioRow label="MLB Debut" value={formatDate(player.mlb_debut_date)} />
      </View>
    </Card>
  );
}