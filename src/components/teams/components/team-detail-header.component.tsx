import { Text } from '@/components/primitives/text.component';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

type TeamDetailHeaderProps = {
  teamName: string;
  homeFieldName: string;
  textColor: string;
  formatName?: string | null;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  showMenu?: boolean;
};

export function TeamDetailHeader({
  teamName,
  homeFieldName,
  textColor,
  formatName,
  onEditPress,
  onDeletePress,
  showMenu = true,
}: TeamDetailHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View className="flex-row items-start justify-between px-4">
      <View className="flex-1 gap-0.5">
        <Text style={{ color: textColor }} className="text-3xl font-bold" numberOfLines={1}>
          {teamName}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons name="stadium-outline" size={16} color={textColor} style={{ opacity: 0.75 }} />
          <Text style={{ color: textColor, opacity: 0.75 }} className="text-xl" numberOfLines={1}>
            {homeFieldName}
          </Text>
        </View>

        {formatName && (
          <View className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons name="baseball-bat" size={16} color={textColor} style={{ opacity: 0.75 }} />
            <Text style={{ color: textColor, opacity: 0.75 }} className="text-xl" numberOfLines={1}>
              {formatName}
            </Text>
          </View>
        )}
      </View>

      {showMenu && (
        <View>
          <Pressable
            onPress={() => setMenuOpen((prev) => !prev)}
            accessibilityLabel="Team options"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={textColor} />
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
                    onEditPress?.();
                  }}
                  className="active:bg-accent px-3 py-2.5"
                >
                  <Text className="text-popover-foreground text-base">Edit Team</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMenuOpen(false);
                    onDeletePress?.();
                  }}
                  className="active:bg-accent px-3 py-2.5"
                >
                  <Text className="text-destructive text-base">Delete Team</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}