import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useInviteFamilyMember } from '@/src/hooks/useFamilySharing';
import { useHousehold } from '@/src/hooks/useProfile';

export default function InviteFamilyScreen() {
  const theme = useTheme();
  const { data: household } = useHousehold();
  const invite = useInviteFamilyMember(household?.id);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    setError(null);
    try {
      await invite.mutateAsync(email);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send this invite.');
    }
  }

  return (
    <Screen edges={['bottom']}>
      <View style={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="body" color="textSecondary">
          They&apos;ll see this home&apos;s full record the moment they sign up or sign in with this email.
        </Text>
        <TextField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoFocus
        />
        {error ? (
          <Text variant="footnote" color="danger">
            {error}
          </Text>
        ) : null}
        <Button label="Send invite" onPress={handleInvite} loading={invite.isPending} disabled={!email.includes('@')} />
      </View>
    </Screen>
  );
}
