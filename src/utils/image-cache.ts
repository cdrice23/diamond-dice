import { Image } from 'react-native';

const prefetchedUris = new Set<string>();

export function prefetchImage(uri: string | null | undefined): void {
  if (!uri || prefetchedUris.has(uri)) return;

  prefetchedUris.add(uri);
  Image.prefetch(uri).catch(() => {
    prefetchedUris.delete(uri);
  });
}