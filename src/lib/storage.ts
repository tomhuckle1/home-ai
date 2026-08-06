import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from './supabase';

export type StorageBucket = 'property-photos' | 'documents';

const MAX_DIMENSION = 1600;
const JPEG_COMPRESSION = 0.7;

/**
 * Downscales and re-compresses a captured photo before upload. Vision
 * extraction doesn't need full camera resolution, and every byte here is
 * OpenAI + Supabase spend (see docs/planning/01-product-analysis-and-risks.md, T2/T5).
 */
export async function prepareImageForUpload(uri: string): Promise<{ uri: string; width: number; height: number }> {
  const context = ImageManipulator.manipulate(uri).resize({ width: MAX_DIMENSION });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_COMPRESSION });
  return result;
}

/**
 * Uploads a local image file to a private, RLS-scoped bucket at
 * "<propertyId>/<uuid>.jpg" — see supabase/migrations/20260806000005_storage_buckets.sql
 * for the policy that depends on this exact path shape.
 */
export async function uploadPropertyImage(
  bucket: StorageBucket,
  propertyId: string,
  localUri: string,
): Promise<string> {
  const prepared = await prepareImageForUpload(localUri);
  const path = `${propertyId}/${Crypto.randomUUID()}.jpg`;

  const bytes = new Uint8Array(await new File(prepared.uri).arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  return path;
}

export async function getSignedUrl(bucket: StorageBucket, path: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
