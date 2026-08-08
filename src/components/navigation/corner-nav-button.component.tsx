import { Pressable, View } from 'react-native';

type CornerNavButtonProps = {
  corner: 'left' | 'right';
  size?: number;
  borderColor: string;
  fillColor: string;
  label: string;
  onPress: () => void;
  iconSize?: number;
  children?: React.ReactNode;
};

export function CornerNavButton({ corner, size = 100, borderColor, fillColor, label, onPress, iconSize = 32, children }: CornerNavButtonProps) {
  const isLeft = corner === 'left';
  const cornerOffset = size * 0.05;
  const circleDiameter = size + cornerOffset * 0.85;
  const radius = circleDiameter / 2;
  const centerFromEdge = -cornerOffset + radius;
  const inwardOffset = radius * 0.05;
  const iconCenterFromEdge = centerFromEdge + inwardOffset;

  return (
    <View style={{ position: 'absolute', bottom: 0, [isLeft ? 'left' : 'right']: 0, width: 0, height: 0 }}>
      <View
        style={{
          position: 'absolute',
          bottom: -cornerOffset,
          [isLeft ? 'left' : 'right']: -cornerOffset,
          width: circleDiameter,
          height: circleDiameter,
          borderRadius: radius,
          backgroundColor: fillColor,
          borderWidth: 2,
          borderColor,
        }}
        pointerEvents="none"
      />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          position: 'absolute',
          bottom: iconCenterFromEdge - iconSize / 2,
          [isLeft ? 'left' : 'right']: iconCenterFromEdge - iconSize / 2,
          width: iconSize,
          height: iconSize,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </Pressable>
    </View>
  );
}