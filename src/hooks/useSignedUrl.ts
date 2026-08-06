import { useQuery } from '@tanstack/react-query';

import { getSignedUrl, type StorageBucket } from '@/src/lib/storage';

export function useSignedUrl(bucket: StorageBucket, path: string | undefined | null) {
  return useQuery({
    queryKey: ['signed-url', bucket, path],
    enabled: !!path,
    queryFn: () => getSignedUrl(bucket, path!),
    staleTime: 30 * 60_000,
  });
}
