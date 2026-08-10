import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { File } from 'expo-file-system';

import { supabase } from './supabase';

const QUEUE_KEY = 'upload-queue';

export type QueuedUpload = {
  id: string;
  localUri: string;
  bucket: string;
  storagePath: string;
  propertyId: string;
  roomId?: string;
  createdAt: string;
  retryCount: number;
};

/** Add a photo to the offline queue */
export async function enqueueUpload(upload: Omit<QueuedUpload, 'id' | 'createdAt' | 'retryCount'>): Promise<QueuedUpload> {
  const entry: QueuedUpload = {
    ...upload,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  const queue = await getQueue();
  queue.push(entry);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return entry;
}

/** Get all queued uploads */
export async function getQueue(): Promise<QueuedUpload[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Remove a completed upload from the queue */
export async function dequeueUpload(id: string): Promise<void> {
  const queue = await getQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter((u) => u.id !== id)));
}

/** Process all pending uploads — call on app start and when connectivity returns */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { processed: 0, failed: 0 };

  const queue = await getQueue();
  let processed = 0;
  let failed = 0;

  for (const upload of queue) {
    try {
      const file = new File(upload.localUri);
      if (!file.exists) {
        await dequeueUpload(upload.id);
        continue;
      }

      const bytes = new Uint8Array(await file.arrayBuffer());

      const { error } = await supabase.storage.from(upload.bucket).upload(upload.storagePath, bytes, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      if (error) throw error;
      await dequeueUpload(upload.id);
      processed++;
    } catch {
      // Increment retry count and leave in queue
      upload.retryCount++;
      if (upload.retryCount > 5) {
        await dequeueUpload(upload.id);
        failed++;
      }
    }
  }

  // Update the queue with retry counts
  const remaining = await getQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

  return { processed, failed };
}

/** Get count of pending uploads */
export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
