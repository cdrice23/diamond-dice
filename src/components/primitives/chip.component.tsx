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
        className="flex-row items-center justify-center gap-1 px-2 py-1"
      >
        <Text style={{ color: textColor }} className={cn('my-1 mx-2 text-md font-semibold', labelClassName)}>
          {label}
        </Text>
        {trailing}
      </LinearGradient>
    </View>
  );
}

export { Chip };
export type { ChipProps };

