import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

const CARD_HEIGHT = 140;
const CARD_RADIUS = 12;
const SPLIT_ANGLE_DEGREES = -60;
const MAX_OFFSET_RATIO = 0.6;
const DASH_ARRAY = '6,5';

type AddTeamColorSplitCardProps = {
  primaryColor: string | null;
  secondaryColor: string | null;
  onPressPrimary: () => void;
  onPressSecondary: () => void;
};

export function AddTeamColorSplitCard({ primaryColor, secondaryColor, onPressPrimary, onPressSecondary }: AddTeamColorSplitCardProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0 && measured !== width) setWidth(measured);
  }

  const angleRad = (SPLIT_ANGLE_DEGREES * Math.PI) / 180;
  const rawDeltaX = CARD_HEIGHT / Math.tan(angleRad);
  const clampedMagnitude = Math.min(Math.abs(rawDeltaX), width * MAX_OFFSET_RATIO);
  const deltaX = Math.sign(rawDeltaX) * clampedMagnitude;

  const xTop = width / 2 - deltaX / 2;
  const xBottom = width / 2 + deltaX / 2;

  const primaryFillPoints = `0,0 ${xTop},0 ${xBottom},${CARD_HEIGHT} 0,${CARD_HEIGHT}`;
  const secondaryFillPoints = `${xTop},0 ${width},0 ${width},${CARD_HEIGHT} ${xBottom},${CARD_HEIGHT}`;

  const primaryOutlinePath = `M ${CARD_RADIUS},0 L ${xTop},0 L ${xBottom},${CARD_HEIGHT} L ${CARD_RADIUS},${CARD_HEIGHT} A ${CARD_RADIUS} ${CARD_RADIUS} 0 0 1 0,${CARD_HEIGHT - CARD_RADIUS} L 0,${CARD_RADIUS} A ${CARD_RADIUS} ${CARD_RADIUS} 0 0 1 ${CARD_RADIUS},0 Z`;

  const secondaryOutlinePath = `M ${xTop},0 L ${width - CARD_RADIUS},0 A ${CARD_RADIUS} ${CARD_RADIUS} 0 0 1 ${width},${CARD_RADIUS} L ${width},${CARD_HEIGHT - CARD_RADIUS} A ${CARD_RADIUS} ${CARD_RADIUS} 0 0 1 ${width - CARD_RADIUS},${CARD_HEIGHT} L ${xBottom},${CARD_HEIGHT} Z`;

  return (
    <View style={{ height: CARD_HEIGHT, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: colors.muted }} onLayout={handleLayout}>
      {width > 0 && (
        <Svg width={width} height={CARD_HEIGHT} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Polygon points={primaryFillPoints} fill={primaryColor ?? colors.muted} />
          <Polygon points={secondaryFillPoints} fill={secondaryColor ?? colors.muted} />

          {!primaryColor && (
            <Path
              d={primaryOutlinePath}
              fill="none"
              stroke={colors.mutedForeground}
              strokeWidth={1}
              strokeDasharray={DASH_ARRAY}
              strokeLinejoin="round"
            />
          )}
          {!secondaryColor && (
            <Path
              d={secondaryOutlinePath}
              fill="none"
              stroke={colors.mutedForeground}
              strokeWidth={1}
              strokeDasharray={DASH_ARRAY}
              strokeLinejoin="round"
            />
          )}
        </Svg>
      )}

      <Pressable
        onPress={onPressPrimary}
        accessibilityLabel="Choose primary color"
        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%' }}
        className="items-center justify-center active:opacity-70"
      >
        <MaterialCommunityIcons name={primaryColor ? 'application-edit-outline' : 'plus'} size={primaryColor ? 20 : 28} color={primaryColor ? '#FFFFFF' : colors.mutedForeground} />
      </Pressable>

      <Pressable
        onPress={onPressSecondary}
        accessibilityLabel="Choose secondary color"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%' }}
        className="items-center justify-center active:opacity-70"
      >
        <MaterialCommunityIcons name={primaryColor ? 'application-edit-outline' : 'plus'} size={primaryColor ? 20 : 28} color={primaryColor ? '#FFFFFF' : colors.mutedForeground} />
      </Pressable>
    </View>
  );
}