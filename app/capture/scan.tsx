import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button, Screen, Text, useTheme } from '@/src/design-system';
import { useCreateDocumentDraft, useRequestExtraction } from '@/src/hooks/useDocuments';
import { friendlyMessage } from '@/src/lib/postgrestError';
import { uploadPropertyImage } from '@/src/lib/storage';
import { supabase } from '@/src/lib/supabase';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

type CaptureMode = 'asset' | 'document';

function CloseButton({ light = false }: { light?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={() => router.back()}
      hitSlop={12}
      style={{
        position: 'absolute', top: theme.spacing.sm, left: theme.spacing.md, zIndex: 10,
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: light ? 'rgba(17, 17, 19, 0.4)' : theme.colors.surfaceAlt,
      }}
    >
      <Ionicons name="close" size={20} color={light ? '#FFFFFF' : theme.colors.textPrimary} />
    </Pressable>
  );
}

export default function ScanScreen() {
  const { propertyId, roomId, mode } = useLocalSearchParams<{ propertyId: string; roomId?: string; mode?: CaptureMode }>();
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createDraft = useCreateDocumentDraft();
  const requestExtraction = useRequestExtraction();

  async function handleCaptured(uri: string) {
    setProcessing(true);
    setError(null);
    try {
      const path = await uploadPropertyImage('documents', propertyId, uri);
      const document = await createDraft.mutateAsync({
        property_id: propertyId,
        room_id: roomId ?? null,
        file_path: path,
        file_type: 'image/jpeg',
        document_type: 'other',
      });
      requestExtraction.mutateAsync(document.id).catch(() => {});
      router.replace(`/document/${document.id}`);
    } catch (err) {
      setError(friendlyMessage(err, 'Could not process that photo.'));
      setProcessing(false);
    }
  }

  async function handleFileUpload() {
    setProcessing(true);
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) {
        setProcessing(false);
        return;
      }

      const file = result.assets[0];
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      const mimeType = file.mimeType ?? (ext === 'pdf' ? 'application/pdf' : 'image/jpeg');

      if (mimeType.startsWith('image/')) {
        await handleCaptured(file.uri);
        return;
      }

      // For PDFs and other files, upload directly without image processing
      const path = `${propertyId}/${Crypto.randomUUID()}.${ext}`;
      const bytes = new Uint8Array(await new File(file.uri).arrayBuffer());
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, bytes, {
        contentType: mimeType,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const document = await createDraft.mutateAsync({
        property_id: propertyId,
        room_id: roomId ?? null,
        file_path: path,
        file_type: mimeType,
        original_filename: file.name,
        document_type: 'other',
      });
      requestExtraction.mutateAsync(document.id).catch(() => {});
      router.replace(`/document/${document.id}`);
    } catch (err) {
      setError(friendlyMessage(err, 'Could not upload that file.'));
      setProcessing(false);
    }
  }

  async function handleTakePhoto() {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
    if (photo?.uri) await handleCaptured(photo.uri);
  }

  async function handlePickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets[0]) await handleCaptured(result.assets[0].uri);
  }

  if (!permission) {
    return (<Screen style={{ justifyContent: 'center' }}><CloseButton /><ActivityIndicator /></Screen>);
  }

  if (!permission.granted) {
    return (
      <Screen style={{ justifyContent: 'center', gap: theme.spacing.md }}>
        <CloseButton />
        <Text variant="title2" style={{ textAlign: 'center' }}>Camera access needed</Text>
        <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
          {mode === 'asset' ? 'Home Memory needs your camera to read appliance labels.' : 'Home Memory needs your camera to scan receipts, manuals and certificates.'}
        </Text>
        <Button label="Allow camera access" onPress={requestPermission} fullWidth={false} />
        <Button label="Choose from library instead" variant="ghost" onPress={handlePickFromLibrary} fullWidth={false} />
        <Button label="Upload a file" variant="ghost" onPress={handleFileUpload} fullWidth={false} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} style={{ backgroundColor: theme.colors.textPrimary }}>
      <View style={{ flex: 1 }}>
        <CloseButton light />
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View style={{ position: 'absolute', bottom: theme.spacing.xxl, left: 0, right: 0, alignItems: 'center', gap: theme.spacing.md }}>
          {error ? (
            <Text variant="footnote" color="danger" style={{ textAlign: 'center', paddingHorizontal: theme.spacing.lg }}>{error}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            disabled={processing}
            onPress={handleTakePhoto}
            style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', opacity: processing ? 0.6 : 1 }}
          >
            {processing ? <ActivityIndicator /> : null}
          </Pressable>
          <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
            <Pressable accessibilityRole="button" onPress={handlePickFromLibrary} disabled={processing}>
              <Text variant="footnote" style={{ color: '#FFFFFF' }}>Library</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleFileUpload} disabled={processing}>
              <Text variant="footnote" style={{ color: '#FFFFFF' }}>Upload file</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}
