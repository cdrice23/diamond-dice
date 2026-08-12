import { Text } from '@/components/primitives/text.component';
import { ScrollView, View } from 'react-native';

type PlaceholderScreenProps = {
  title: string;
  accentColor: string;
};

const LOREM_SNIPPETS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna.',
  'Ut enim ad minim veniam, quis nostrud exercitation.',
];

export function PlaceholderScreen({ title, accentColor }: PlaceholderScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 16, paddingTop: 60 }}
      className="bg-background"
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