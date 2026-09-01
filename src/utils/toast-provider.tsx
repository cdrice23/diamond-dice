import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastVariant = 'error' | 'success' | 'info';

type ToastState = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  error: 5000,
  success: 3000,
  info: 3500,
};

const VARIANT_ICON: Record<ToastVariant, string> = {
  error: 'alert-circle-outline',
  success: 'check-circle-outline',
  info: 'information-outline',
};

const ANIMATION_DURATION = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-16);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    opacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    translateY.value = withTiming(-16, { duration: ANIMATION_DURATION });
    setTimeout(() => setToast(null), ANIMATION_DURATION);
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', durationMs?: number) => {
      idRef.current += 1;
      setToast({ id: idRef.current, message, variant });

      opacity.value = 0;
      translateY.value = -16;
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(dismiss, durationMs ?? DEFAULT_DURATION_MS[variant]);
    },
    [opacity, translateY, dismiss]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const accentColor =
    toast?.variant === 'error' ? colors.destructive : toast?.variant === 'success' ? colors.level1 : colors.level2;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
          <Animated.View style={[{ marginTop: insets.top + 8, marginHorizontal: 16 }, animatedStyle]}>
            <Pressable
              onPress={dismiss}
              className="bg-card border-border flex-row items-center gap-2.5 rounded-md border p-3 shadow-sm shadow-black/20"
              style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
            >
              <MaterialCommunityIcons name={VARIANT_ICON[toast.variant] as any} size={20} color={accentColor} />
              <Text className="text-foreground flex-1 text-sm font-medium">{toast.message}</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}