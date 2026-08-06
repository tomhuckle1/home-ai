import { Image } from 'expo-image';

import { useSignedUrl } from '@/src/hooks/useSignedUrl';
import type { StorageBucket } from '@/src/lib/storage';

import { useTheme } from './theme';

export type ThumbnailProps = {
  bucket: StorageBucket;
  path: string | null | undefined;
  size?: number;
};

/**
 * A small rounded photo for a list row's `leading` slot. Renders nothing
 * when there's no path — callers should fall back to an emoji icon in
 * that case, same as before this component existed. Deliberately only
 * used on small, bounded lists (a room's items, a household's
 * properties) — signing a URL is a network round-trip per row, which
 * doesn't scale to the Documents tab's potentially long, unbounded list.
 */
export function Thumbnail({ bucket, path, size = 44 }: ThumbnailProps) {
  const theme = useTheme();
  const { data: url } = useSignedUrl(bucket, path);

  if (!path || !url) return null;

  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceAlt }}
      contentFit="cover"
    />
  );
}
