import { Input } from '@/components/primitives/input.component';
import { cn } from '@/utils/utils';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

type PasswordInputProps = React.ComponentProps<typeof Input> & { iconColor?: string; error?: boolean };

export function PasswordInput({ className, iconColor, error, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="relative justify-center">
      <Input secureTextEntry={!visible} error={error} className={cn('pr-10', className)} {...props} />
      <Pressable onPress={() => setVisible((v) => !v)} className="absolute right-3" hitSlop={8}>
        <Ionicons name={visible ? 'eye-off' : 'eye'} size={20} color={iconColor} />
      </Pressable>
    </View>
  );
}