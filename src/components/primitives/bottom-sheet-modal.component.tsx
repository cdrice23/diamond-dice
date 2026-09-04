import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const BACKDROP_DURATION = 220;
const SHEET_DURATION = 280;
const OFFSCREEN_Y = 1000;

type BottomSheetModalProps = {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function BottomSheetModal({ visible, onDismiss, children, contentStyle }: BottomSheetModalProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const [prevVisible, setPrevVisible] = useState(visible);
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(OFFSCREEN_Y);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setIsMounted(true);
    }
  }

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
      sheetTranslateY.value = withTiming(0, { duration: SHEET_DURATION, easing: Easing.out(Easing.cubic) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION });
      sheetTranslateY.value = withTiming(OFFSCREEN_Y, { duration: SHEET_DURATION, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      });
    }
  }, [visible, backdropOpacity, sheetTranslateY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetTranslateY.value }] }));

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} className="bg-black/40" onPress={onDismiss} />
        </Animated.View>

        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <Animated.View style={[sheetStyle, contentStyle]}>{children}</Animated.View>
        </View>
      </View>
    </Modal>
  );
}