import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

type ProfileHeaderProps = {
  username: string;
  displayName: string;
};

export function ProfileHeader({ username, displayName }: ProfileHeaderProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-start justify-between px-4 pt-2">
      <View>
        <Text variant="small" className="text-muted-foreground">
          @{username}
        </Text>
        <Text className="text-foreground text-3xl font-bold">{displayName}</Text>
      </View>
      <Pressable
        onPress={() => router.push('/(app)/edit-profile')}
        accessibilityRole="button"
        accessibilityLabel="Edit profile settings"
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
      >
        <Ionicons name="settings-outline" size={24} color={colors.foreground} />
      </Pressable>
    </View>
  );
}