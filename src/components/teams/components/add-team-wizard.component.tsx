import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

const NAV_CLEARANCE_EXTRA = 16;

type AddTeamWizardProps = {
  subtitle?: string;
  helperText?: string;
  headerAction?: ReactNode;
  onCancel: () => void;
  onBack: (() => void) | null;
  onConfirm: (() => void) | null;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  showBottomBar?: boolean;
  hideDefaultHeader?: boolean;
  children: ReactNode;
};

export function AddTeamWizard({
  onCancel,
  onBack,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmDisabled = false,
  showBottomBar = true,
  hideDefaultHeader = false,
  subtitle,
  helperText,
  headerAction,
  children,
}: AddTeamWizardProps) {
  const { colors } = useTheme();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();

  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;

  return (
    <View style={{ flex: 1 }}>
      {!hideDefaultHeader && (
        <>
          <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} topBandHeight={40} />

          <View className="gap-1 px-4 pb-2 pt-20">
            <View className="flex-row items-start justify-between">
              <Text className="text-foreground text-3xl font-bold">New Team</Text>
              {headerAction}
            </View>
            {subtitle && <Text className="text-foreground text-lg font-semibold">{subtitle}</Text>}
            {helperText && (
              <Text variant="muted" className="text-sm">
                {helperText}
              </Text>
            )}
          </View>
        </>
      )}

      <View style={{ flex: 1, paddingBottom: showBottomBar ? 0 : navClearance }}>{children}</View>

      {showBottomBar && (
        <View style={{ paddingBottom: navClearance }} className="gap-2 px-4 pt-3">
          <View className="flex-row gap-3">
            {onBack ? (
              <Pressable
                onPress={onBack}
                className="flex-row items-center justify-center gap-1 rounded-sm py-3 active:opacity-60"
                style={{ backgroundColor: colors.muted, flex: 1 }}
              >
                <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground }} className="text-lg font-semibold">
                  Back
                </Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {onConfirm && (
              <Pressable
                onPress={onConfirm}
                disabled={confirmDisabled}
                className="items-center justify-center rounded-sm py-3 active:opacity-70"
                style={{ backgroundColor: colors.level2, opacity: confirmDisabled ? 0.5 : 1, flex: 2 }}
              >
                <Text className="text-lg font-semibold text-white">{confirmLabel}</Text>
              </Pressable>
            )}
          </View>
          <Pressable onPress={onCancel} className="items-center rounded-sm py-2.5 active:opacity-60" style={{ backgroundColor: colors.muted }}>
            <Text style={{ color: colors.mutedForeground }} className="text-lg font-semibold">
              Cancel
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}