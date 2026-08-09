import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateContractor } from '@/src/hooks/useContractors';

export default function NewContractorScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const theme = useTheme();
  const createContractor = useCreateContractor();

  const [name, setName] = useState('');
  const [trade, setTrade] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      await createContractor.mutateAsync({
        property_id: propertyId,
        name: name.trim(),
        trade: trade.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this contractor.');
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="title1">Add contractor</Text>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField label="Name" value={name} onChangeText={setName} autoFocus placeholder="e.g. Smith Plumbing" />
          <TextField label="Trade" value={trade} onChangeText={setTrade} placeholder="e.g. Plumber, Electrician" />
          <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextField label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
          <TextField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="e.g. Recommended by neighbour" />
        </View>

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

        <Button label="Save contractor" onPress={handleSave} loading={createContractor.isPending} disabled={!name.trim()} />
      </ScrollView>
    </Screen>
  );
}
