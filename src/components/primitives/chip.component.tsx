import { adjustHslLightness } from '@/utils/color';
import { cn } from '@/utils/utils';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './text.component';

type ChipProps = {
  label: string;
  backgroundColor: string;
  textColor?: string;
  shape?: 'rounded' | 'square';
  className?: string;
  labelClassName?: string;
  trailing?: ReactNode;
};

const GRADIENT_LIGHTEN_PERCENT = 4;
const GRADIENT_DARKEN_PERCENT = -4;
const LABEL_FONT_SIZE = 15;
const LABEL_LINE_HEIGHT = 20;

function Chip({
  label,
  backgroundColor,
  textColor = '#F7F7F7',
  shape = 'rounded',
  className,
  labelClassName,
  trailing,
}: ChipProps) {
  const lightStop = adjustHslLightness(backgroundColor, GRADIENT_LIGHTEN_PERCENT);
  const darkStop = adjustHslLightness(backgroundColor, GRADIENT_DARKEN_PERCENT);

  return (
    <View className={cn(shape === 'rounded' ? 'rounded-full' : 'rounded-sm', 'overflow-hidden', className)}>
      <LinearGradient
        colors={[lightStop, darkStop]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex flex-row items-center justify-center gap-1 px-2.5 py-1.5"
      >
        <Text
          style={{ 
            color: textColor, 
            fontSize: LABEL_FONT_SIZE, 
            lineHeight: LABEL_LINE_HEIGHT,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
           }}
          className={cn('font-semibold', 'mx-auto px-2', labelClassName)}
        >
          {label}
        </Text>
        {trailing}
      </LinearGradient>
    </View>
  );
}

export { Chip };
export type { ChipProps };

