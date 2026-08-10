import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';

import { Button, Card, ChipSelect, DateInput, ListRow, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateAsset } from '@/src/hooks/useAssets';
import { useCreateMaintenanceTask } from '@/src/hooks/useMaintenance';
import { useRooms, useCreateRoom } from '@/src/hooks/useRooms';
import { SMART_CATEGORIES } from '@/src/lib/smart-templates';

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'biannual', label: 'Every 6 months' },
  { value: 'annual', label: 'Yearly' },
];

export default function SmartFormScreen() {
  const { categoryId, propertyId } = useLocalSearchParams<{ categoryId: string; propertyId: string }>();
  const theme = useTheme();
  const category = SMART_CATEGORIES.find((c) => c.id === categoryId);
  const { data: rooms } = useRooms(propertyId);
  const createAsset = useCreateAsset();
  const createRoom = useCreateRoom();
  const createReminder = useCreateMaintenanceTask();

  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState<string | undefined>();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [enabledReminders, setEnabledReminders] = useState<Record<number, boolean>>(
    Object.fromEntries((category?.reminders ?? []).map((r, i) => [i, r.defaultEnabled]))
  );
  const [reminderFreqs, setReminderFreqs] = useState<Record<number, string>>(
    Object.fromEntries((category?.reminders ?? []).map((r, i) => [i, r.frequencyType]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!category) return null;
  const cat = category;

  function setField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleQuickItem(item: string) {
    setName(item);
    if (category?.suggestedRoom && rooms) {
      const match = rooms.find((r) => r.name.toLowerCase() === category.suggestedRoom!.toLowerCase());
      if (match && !roomId) setRoomId(match.id);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let finalRoomId = roomId;
      if (cat.askRoom && roomId === '__new__') {
        const suggestedName = cat.suggestedRoom || 'Room';
        const newRoom = await createRoom.mutateAsync({ property_id: propertyId, name: suggestedName });
        finalRoomId = newRoom.id;
      }

      const asset = await createAsset.mutateAsync({
        property_id: propertyId,
        room_id: finalRoomId ?? null,
        name: name.trim(),
        category: cat.assetCategory,
        brand: fieldValues.brand?.trim() || null,
        model: fieldValues.model?.trim() || null,
        serial_number: fieldValues.serial_number?.trim() || null,
        retailer: fieldValues.retailer?.trim() || fieldValues.contractor?.trim() || fieldValues.supplier?.trim() || null,
        purchase_date: fieldValues.purchase_date?.trim() || fieldValues.install_date?.trim() || null,
        purchase_price: fieldValues.purchase_price?.trim() ? Number(fieldValues.purchase_price) : (fieldValues.cost?.trim() ? Number(fieldValues.cost) : null),
        warranty_expiry: fieldValues.warranty_expiry?.trim() || null,
        notes: fieldValues.description?.trim() || null,
        status: 'active',
        attributes: {
          smart_category: cat.id,
          last_service: fieldValues.last_service || null,
          device_type: fieldValues.device_type || null,
          detail_subtype: fieldValues.detail_subtype || null,
          colour_name: fieldValues.colour_name || null,
          colour_code: fieldValues.colour_code || null,
          finish: fieldValues.finish || null,
          material: fieldValues.material || null,
          quantity: fieldValues.quantity || null,
        },
      });

      // Create reminders with user-selected frequency
      const activeReminders = cat.reminders.filter((_, i) => enabledReminders[i]);
      for (let i = 0; i < cat.reminders.length; i++) {
        if (!enabledReminders[i]) continue;
        const reminder = cat.reminders[i];
        const freq = reminderFreqs[i] || reminder.frequencyType;
        const nextDue = calculateNextDue(freq);
        await createReminder.mutateAsync({
          property_id: propertyId, asset_id: asset.id,
          title: `${name.trim()} — ${reminder.title}`,
          description: reminder.description, frequency_type: freq,
          next_due_date: nextDue, source: 'user',
        }).catch(() => {});
      }

      // Overdue service warning
      if (fieldValues.last_service) {
        const monthsAgo = (Date.now() - new Date(fieldValues.last_service).getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsAgo > 12) {
          Alert.alert('Service may be overdue', `Last serviced ${Math.round(monthsAgo)} months ago. Consider booking a service soon.`);
        }
      }

      // Offer to attach a document
      Alert.alert(
        'Attach a document?',
        'Got a receipt, warranty, or manual for this item?',
        [
          { text: 'Scan now', onPress: () => router.replace({ pathname: '/capture/scan', params: { propertyId, roomId: finalRoomId ?? '', mode: 'document' } }) },
          { text: 'Not now', style: 'cancel', onPress: () => router.replace(`/asset/${asset.id}`) },
        ]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  const roomOptions = [
    ...(rooms ?? []).map((r) => ({ value: r.id, label: r.name })),
    { value: '__new__', label: `+ New room${category.suggestedRoom ? ` (${category.suggestedRoom})` : ''}` },
  ];

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        {/* Header with back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="title1">{category.label}</Text>
            <Text variant="footnote" color="textSecondary">{category.description}</Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, lineHeight: 34 }}>{category.icon}</Text>
          </View>
        </View>

        {/* Quick items */}
        {category.quickItems && category.quickItems.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">Quick add</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {category.quickItems.map((item) => (
                <Pressable key={item} accessibilityRole="button" onPress={() => handleQuickItem(item)}
                  style={({ pressed }) => ({ paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.radius.md, backgroundColor: name === item ? theme.colors.accent : theme.colors.surfaceAlt, opacity: pressed ? 0.7 : 1 })}>
                  <Text variant="body" style={{ color: name === item ? theme.colors.onAccent : theme.colors.textPrimary }}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <TextField label="Name" value={name} onChangeText={setName} placeholder={category.quickItems?.[0] ? `e.g. ${category.quickItems[0]}` : 'What is it?'} />

        {/* Photo scan */}
        {category.offerPhotoScan ? (
          <Card onPress={() => router.push({ pathname: '/capture/scan', params: { propertyId, mode: 'asset' } })}>
            <ListRow leading={<Ionicons name="camera-outline" size={22} color={theme.colors.accent} />} title="Scan a label or photo" subtitle="AI reads the brand, model, and serial number" showChevron />
          </Card>
        ) : null}

        {/* Room picker */}
        {category.askRoom ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">Where is it? (optional)</Text>
            <ChipSelect options={roomOptions} value={roomId} onChange={setRoomId} />
          </View>
        ) : null}

        {/* Fields */}
        <View style={{ gap: theme.spacing.sm }}>
          {category.fields.map((field) => {
            if (field.type === 'select' && field.options) {
              return (
                <View key={field.key} style={{ gap: theme.spacing.xs }}>
                  <Text variant="footnote" color="textSecondary">{field.label}</Text>
                  <ChipSelect options={field.options} value={fieldValues[field.key]} onChange={(v) => setField(field.key, v ?? '')} />
                </View>
              );
            }
            if (field.type === 'date') {
              return (
                <DateInput
                  key={field.key}
                  label={field.label}
                  value={fieldValues[field.key] ?? ''}
                  onChange={(v) => setField(field.key, v)}
                />
              );
            }
            return (
              <TextField key={field.key} label={field.label} value={fieldValues[field.key] ?? ''} onChangeText={(v) => setField(field.key, v)} placeholder={field.placeholder} keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'} multiline={field.type === 'multiline'} numberOfLines={field.type === 'multiline' ? 3 : 1} />
            );
          })}
        </View>

        {/* Reminders with customizable frequency */}
        {category.reminders.length > 0 ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="headline">Reminders</Text>
            {category.reminders.map((reminder, index) => (
              <View key={index} style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.sm, gap: theme.spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="body">{reminder.title}</Text>
                    <Text variant="caption" color="textSecondary">{reminder.description}</Text>
                  </View>
                  <Switch value={enabledReminders[index]} onValueChange={(v) => setEnabledReminders((prev) => ({ ...prev, [index]: v }))} trackColor={{ true: theme.colors.accent, false: theme.colors.surfaceAlt }} />
                </View>
                {enabledReminders[index] ? (
                  <View style={{ gap: theme.spacing.xxs }}>
                    <Text variant="caption" color="textTertiary">How often?</Text>
                    <ChipSelect options={FREQUENCY_OPTIONS} value={reminderFreqs[index]} onChange={(v) => setReminderFreqs((prev) => ({ ...prev, [index]: v ?? 'annual' }))} allowDeselect={false} />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}
        <Button label="Save" onPress={handleSave} loading={saving} disabled={!name.trim()} size="lg" />
      </ScrollView>
    </Screen>
  );
}

function calculateNextDue(frequencyType: string): string {
  const now = new Date();
  switch (frequencyType) {
    case 'weekly': now.setDate(now.getDate() + 7); break;
    case 'monthly': now.setMonth(now.getMonth() + 1); break;
    case 'quarterly': now.setMonth(now.getMonth() + 3); break;
    case 'biannual': now.setMonth(now.getMonth() + 6); break;
    case 'annual': now.setFullYear(now.getFullYear() + 1); break;
    default: now.setFullYear(now.getFullYear() + 1); break;
  }
  return now.toISOString().slice(0, 10);
}
