import { cn } from '@/utils/utils';
import { Pressable, View } from 'react-native';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
};

function Card({ children, onPress, className }: CardProps) {
  const baseClassName = cn('bg-card border-border rounded-lg border p-4 shadow-sm shadow-black/5', className);

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={cn(baseClassName, 'active:opacity-70')} accessibilityRole="button">
        {children}
      </Pressable>
    );
  }

  return <View className={baseClassName}>{children}</View>;
}

export { Card };
export type { CardProps };
