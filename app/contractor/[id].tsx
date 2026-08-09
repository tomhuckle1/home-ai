import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button, Card, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useContractor, useDeleteContractor, useUpdateContractor } from '@/src/hooks/useContractors';

export default function ContractorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: contractor } = useContractor(id);
  const updateContractor = useUpdateContractor();
  const deleteContractor = useDeleteContractor();
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(contractor?.name ?? '');
  const [trade, setTrade] = useState(contractor?.trade ?? '');
  const [phone, setPhone] = useState(contractor?.phone ?? '');
  const [email, setEmail] = useState(contractor?.email ?? '');
  const [website, setWebsite] = useState(contractor?.website ?? '');
  const [notes, setNotes] = useState(contractor?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!contractor) return null;

  async function handleSave() {
    setError(null);
    try {
      await updateContractor.mutateAsync({
        id,
        update: {
          name: name.trim(),
          trade: trade.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          website: website.trim() || null,
          notes: notes.trim() || null,
        },
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    }
  }

  function handleDelete() {
    Alert.alert(`Delete "${contractor!.name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteContractor.mutate(
            { id: contractor!.id, property_id: contractor!.property_id },
            {
              onSuccess: () => router.back(),
              onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.'),
            },
          );
        },
      },
    ]);
  }

  if (editing) {
    return (
      <Screen edges={['bottom']}>
        <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
          <Text variant="title1">Edit contractor</Text>
          <View style={{ gap: theme.spacing.sm }}>
            <TextField label="Name" value={name} onChangeText={setName} />
            <TextField label="Trade" value={trade} onChangeText={setTrade} />
            <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextField label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
            <TextField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
          </View>
          {error ? <Text variant="footnote" color="danger">{error}</Text> : null}
          <Button label="Save changes" onPress={handleSave} loading={updateContractor.isPending} />
          <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="title1">{contractor.name}</Text>

        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            {contractor.trade ? <Field label="Trade" value={contractor.trade} /> : null}
            {contractor.phone ? (
              <Field label="Phone" value={contractor.phone} onPress={() => Linking.openURL(`tel:${contractor.phone}`)} />
            ) : null}
            {contractor.email ? (
              <Field label="Email" value={contractor.email} onPress={() => Linking.openURL(`mailto:${contractor.email}`)} />
            ) : null}
            {contractor.website ? (
              <Field label="Website" value={contractor.website} onPress={() => Linking.openURL(contractor.website!)} />
            ) : null}
            {contractor.notes ? <Field label="Notes" value={contractor.notes} /> : null}
          </View>
        </Card>

        <Button label="Edit" variant="secondary" onPress={() => setEditing(true)} />
        <Button label="Delete contractor" variant="danger" onPress={handleDelete} loading={deleteContractor.isPending} />
      </ScrollView>
    </Screen>
  );
}

function Field({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" color="textTertiary">{label.toUpperCase()}</Text>
      <Text variant="body" color={onPress ? 'accent' : 'textPrimary'} onPress={onPress}>{value}</Text>
    </View>
  );
}
