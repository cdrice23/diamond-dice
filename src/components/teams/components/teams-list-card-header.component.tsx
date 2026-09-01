import { Text } from '@/components/primitives/text.component';
import { resolveTeamColors } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

type TeamsListCardHeaderProps = {
  teamName: string;
  primaryColor: string;
  secondaryColor: string;
  onEditPress: () => void;
  onDeletePress: () => void;
};

export function TeamsListCardHeader({
  teamName,
  primaryColor,
  secondaryColor,
  onEditPress,
  onDeletePress,
}: TeamsListCardHeaderProps) {
  const { colors } = useTheme();
  const { backgroundColor: background, textColor: text, accentColor: accent } = resolveTeamColors(
    primaryColor,
    secondaryColor,
    colors.background
  );
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ backgroundColor: background }} className="flex-row items-center justify-between px-4 py-3.5">
      <View className="flex-1 flex-row items-center gap-2.5">
        <View style={{ width: 5, height: 24, borderRadius: 2.5, backgroundColor: accent }} />
        <Text style={{ color: text }} className="flex-1 text-xl font-bold" numberOfLines={1}>
          {teamName}
        </Text>
      </View>

      <View>
        <Pressable
          onPress={() => setMenuOpen((prev) => !prev)}
          accessibilityLabel="Team options"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={text} />
        </Pressable>

        {menuOpen && (
          <>
            <Pressable
              style={{ position: 'absolute', top: -1000, left: -1000, right: -1000, bottom: -1000 }}
              onPress={() => setMenuOpen(false)}
            />
            <View className="bg-popover border-border absolute right-0 top-8 z-10 w-36 rounded-sm border py-1 shadow-sm shadow-black/10">
              <Pressable
                onPress={() => {
                  setMenuOpen(false);
                  onEditPress();
                }}
                className="active:bg-accent px-3 py-2.5"
              >
                <Text className="text-popover-foreground text-base">Edit Team</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setMenuOpen(false);
                  onDeletePress();
                }}
                className="active:bg-accent px-3 py-2.5"
              >
                <Text className="text-destructive text-base">Delete Team</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}