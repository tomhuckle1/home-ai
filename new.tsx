import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ChipSelect, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateRoom } from '@/src/hooks/useRooms';

const ROOM_TYPES = [
  'Kitchen', 'Bathroom', 'Bedroom', 'Living room', 'Dining room',
  'Garden', 'Garage', 'Hallway', 'Utility room', 'Office',
  'Loft', 'Exterior', 'Other',
].map((type) => ({ value: type, label: type }));

const FLOORS = [
  { value: 'Basement', label: 'Basement' },
  { value: 'Ground', label: 'Ground' },
  { value: 'First', label: 'First' },
  { value: 'Second', label: 'Second' },
  { value: 'Third', label: 'Third' },
  { value: 'Attic', label: 'Attic' },
];

export default function NewRoomScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const theme = useTheme();
  const createRoom = useCreateRoom();

  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState<string | undefined>();
  const [floor, setFloor] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      const room = await createRoom.mutateAsync({
        property_id: propertyId,
        name: name.trim(),
        room_type: roomType ?? null,
        floor: floor ?? null,
      });
      router.replace(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this room.');
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">Room type</Text>
          <ChipSelect
            options={ROOM_TYPES}
            value={roomType}
            onChange={(type) => { setRoomType(type); if (type && !name) setName(type); }}
          />
        </View>

        <TextField label="Room name" value={name} onChangeText={setName} autoFocus placeholder="e.g. Kitchen" />

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">Floor (optional)</Text>
          <ChipSelect options={FLOORS} value={floor} onChange={setFloor} />
        </View>

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

        <Button label="Add room" onPress={handleSave} loading={createRoom.isPending} disabled={!name.trim()} />
      </ScrollView>
    </Screen>
  );
}
