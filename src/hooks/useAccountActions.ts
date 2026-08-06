import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { supabase } from '@/src/lib/supabase';

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('export-data');
      if (error) throw error;

      const exportsDir = new Directory(Paths.cache, 'exports');
      if (!exportsDir.exists) exportsDir.create();

      const file = new File(exportsDir, `home-memory-export-${Crypto.randomUUID()}.json`);
      file.write(JSON.stringify(data, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Your Home Memory data' });
      }

      return file.uri;
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await supabase.auth.signOut();
    },
  });
}
