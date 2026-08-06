// Registers this device for maintenance-reminder push notifications (see
// supabase/functions/send-maintenance-reminders). Getting a real Expo push
// token requires an EAS project id, which this app doesn't have configured
// yet (no `eas init` has been run) — see docs/release/submission-checklist.md.
// Until then this fails fast and silently; nothing here should ever crash
// or surface an error to the user over a missing push token, since it's a
// background enhancement, not something they took an action to get.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { supabase } from './supabase';

export async function registerForPushNotificationsIfNeeded(): Promise<void> {
  if (!Device.isDevice) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status === 'undetermined') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return;

    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });

    const { error } = await supabase
      .from('push_tokens')
      .upsert({ user_id: data.user.id, token: pushToken.data }, { onConflict: 'token' });
    if (error) throw error;
  } catch (err) {
    // Best-effort — a user should never see an error for a background
    // registration step they didn't take an action to trigger.
    console.warn('Push notification registration skipped:', err instanceof Error ? err.message : err);
  }
}
