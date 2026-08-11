import { Button } from '@/components/primitives/button.component';
import { Text } from '@/components/primitives/text.component';
import { View } from 'react-native';

type MenuOverlayProps = {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
};

export function MenuOverlay({ visible, onClose, accentColor }: MenuOverlayProps) {
  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: accentColor,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
      }}
    >
      <Text>Menu (placeholder)</Text>
      <Button variant="ghost" onPress={onClose}>
        <Text>Close</Text>
      </Button>
    </View>
  );
}