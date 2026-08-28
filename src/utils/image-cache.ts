import { Image } from 'react-native';

const prefetchedUris = new Set<string>();
const MLB_WIDTH_PATTERN = /w_\d+/;

export function prefetchImage(uri: string | null | undefined): void {
  if (!uri || prefetchedUris.has(uri)) return;

  prefetchedUris.add(uri);
  Image.prefetch(uri).catch(() => {
    prefetchedUris.delete(uri);
  });
}

export function scaledMlbImageUrl(url: string | null, width: number): string | null {
  if (!url) return null;
  if (!MLB_WIDTH_PATTERN.test(url)) return url;
  return url.replace(MLB_WIDTH_PATTERN, `w_${width}`);
}