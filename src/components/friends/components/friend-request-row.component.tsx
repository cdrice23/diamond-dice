import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

const CHIP_SIZE = 38;
const ICON_SIZE = 20;
const PRESSED_BACKGROUND_ALPHA = 0.22;

type FriendRequestRowProps = {
  username: string;
  displayName: string;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
};

function ActionChip({
  color,
  iconName,
  accessibilityLabel,
  onPress,
}: {
  color: string;
  iconName: 'close' | 'check';
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.chip,
        {
          borderColor: color,
          backgroundColor: pressed ? adjustHslAlpha(color, PRESSED_BACKGROUND_ALPHA) : colors.background,
        },
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={ICON_SIZE} color={color} />
    </Pressable>
  );
}

export function FriendRequestRow({ username, displayName, onAccept, onReject }: FriendRequestRowProps) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    if (busy) return;
    setBusy(true);
    try {
      await onAccept();
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (busy) return;
    setBusy(true);
    try {
      await onReject();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 pr-3">
        <Text className="text-foreground text-lg font-semibold">{displayName}</Text>
        <Text variant="muted" className="text-base">{`@${username}`}</Text>
      </View>

      {busy ? (
        <ActivityIndicator color={colors.mutedForeground} />
      ) : (
        <View className="flex-row items-center gap-2.5">
          <ActionChip
            color={colors.level3}
            iconName="close"
            accessibilityLabel={`Reject request from ${username}`}
            onPress={handleReject}
          />
          <ActionChip
            color={colors.level1}
            iconName="check"
            accessibilityLabel={`Accept request from ${username}`}
            onPress={handleAccept}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
  },
});