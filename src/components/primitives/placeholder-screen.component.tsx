import { Text } from '@/components/primitives/text.component';
import { ScrollView, View } from 'react-native';

type PlaceholderScreenProps = {
  title: string;
  accentColor: string;
  floating?: boolean;
  cardBackgroundColor?: string;
};

const LOREM_SNIPPETS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna.',
  'Ut enim ad minim veniam, quis nostrud exercitation.',
];

export function PlaceholderScreen({ title, accentColor, floating = false, cardBackgroundColor }: PlaceholderScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 16,
        paddingTop: floating ? 40 : 60,
        ...(floating
          ? {
              margin: 20,
              marginTop: 60,
              borderRadius: 16,
              backgroundColor: cardBackgroundColor,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }
          : {}),
      }}
      className={floating ? undefined : 'bg-background'}
    >
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
      {LOREM_SNIPPETS.map((snippet, i) => (
        <View
          key={i}
          style={{
            borderWidth: 2,
            borderColor: accentColor,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 14, opacity: 0.7 }}>{snippet}</Text>
        </View>
      ))}
    </ScrollView>
  );
}