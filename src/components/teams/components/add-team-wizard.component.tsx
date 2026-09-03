import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { Text } from '@/components/primitives/text.component';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

type AddTeamWizardProps = {
  title?: string;
  titleIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  subtitle?: string;
  helperText?: string;
  headerAction?: ReactNode;
  footerBanner?: ReactNode;
  actionsLayout?: 'default' | 'stacked';
  onCancel: () => void;
  onBack: (() => void) | null;
  onConfirm: (() => void) | null;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  showBottomBar?: boolean;
  hideDefaultHeader?: boolean;
  children: ReactNode;
};

const NAV_CLEARANCE_EXTRA = 16;

export function AddTeamWizard({
  onCancel,
  onBack,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmDisabled = false,
  showBottomBar = true,
  hideDefaultHeader = false,
  title = 'New Team',
  titleIcon = 'file-document-plus-outline',
  subtitle,
  helperText,
  headerAction,
  footerBanner,
  actionsLayout = 'default',
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
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name={titleIcon} size={24} color={colors.foreground} />
                <Text className="text-foreground text-3xl font-bold">{title}</Text>
              </View>
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
          {footerBanner && <View className="pb-1">{footerBanner}</View>}

          {actionsLayout === 'stacked' ? (
            <>
              {onConfirm && (
                <Pressable
                  onPress={onConfirm}
                  disabled={confirmDisabled}
                  className="items-center justify-center rounded-sm py-3 active:opacity-70"
                  style={{ backgroundColor: confirmDisabled ? adjustHslAlpha(colors.level2, 0.5) : colors.level2 }}
                >
                  <Text className="text-lg font-semibold" style={{ color: confirmDisabled ? colors.muted : colors.primary }}>
                    {confirmLabel}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={onBack ?? onCancel}
                className="items-center rounded-sm py-2.5 active:opacity-60"
                style={{ backgroundColor: colors.muted }}
              >
                <Text style={{ color: colors.mutedForeground }} className="text-lg font-semibold">
                  Back
                </Text>
              </Pressable>
            </>
          ) : (
            <>
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
                ) : null}
                {onConfirm && (
                  <Pressable
                    onPress={onConfirm}
                    disabled={confirmDisabled}
                    className="items-center justify-center rounded-sm py-3 active:opacity-70"
                    style={{ backgroundColor: confirmDisabled ? adjustHslAlpha(colors.level2, 0.5) : colors.level2, flex: onBack ? 2 : 1 }}
                  >
                    <Text className="text-lg font-semibold" style={{ color: confirmDisabled ? colors.muted : '#F7F7F7' }}>
                      {confirmLabel}
                    </Text>
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={onCancel}
                className="items-center rounded-sm py-2.5 active:opacity-60"
                style={{ backgroundColor: colors.muted }}
              >
                <Text style={{ color: colors.mutedForeground }} className="text-lg font-semibold">
                  Cancel
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}