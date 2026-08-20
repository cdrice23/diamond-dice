import { cn } from '@/utils/utils';
import { View } from 'react-native';
import { Text } from './text.component';

type ChipProps = {
  label: string;
  backgroundColor: string;
  textColor?: string;
  shape?: 'rounded' | 'square';
  className?: string;
  size?: string
};

function Chip({ label, backgroundColor, textColor = '#FFFFFF', shape = 'rounded', className }: ChipProps) {
  return (
    <View
      style={{ backgroundColor }}
      className={cn(
        'items-center justify-center px-2 py-1',
        shape === 'rounded' ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      <Text style={{ color: textColor }} className="text-md font-semibold">
        {label}
      </Text>
    </View>
  );
}

export { Chip };
export type { ChipProps };

