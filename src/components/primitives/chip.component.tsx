import { cn } from '@/utils/utils';
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

function Chip({
  label,
  backgroundColor,
  textColor = '#FFFFFF',
  shape = 'rounded',
  className,
  labelClassName,
  trailing,
}: ChipProps) {
  return (
    <View
      style={{ backgroundColor }}
      className={cn(
        'flex-row items-center justify-center gap-1 px-2 py-1',
        shape === 'rounded' ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      <Text style={{ color: textColor }} className={cn('text-md font-semibold', labelClassName)}>
        {label}
      </Text>
      {trailing}
    </View>
  );
}

export { Chip };
export type { ChipProps };
