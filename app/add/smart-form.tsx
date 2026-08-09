import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';

import { Badge, Button, Card, ChipSelect, ListRow, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateAsset } from '@/src/hooks/useAssets';
import { useCreateMaintenanceTask } from '@/src/hooks/useMaintenance';
import { useRooms, useCreateRoom } from '@/src/hooks/useRooms';
import { SMART_CATEGORIES, type SmartCategory, type SuggestedReminder } from '@/src/lib/smart-templates';

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!category) return null;

  function setField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleQuickItem(item: string) {
    setName(item);
    // Auto-suggest room based on item name
    if (category?.suggestedRoom && rooms) {
      const match = rooms.find((r) => r.name.toLowerCase() === category.suggestedRoom!.toLowerCase());
      if (match && !roomId) setRoomId(match.id);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Auto-create room if needed
      let finalRoomId = roomId;
      if (category.askRoom && roomId === '__new__') {
        const suggestedName = category.suggestedRoom || 'Room';
        const newRoom = await createRoom.mutateAsync({ property_id: propertyId, name: suggestedName });
        finalRoomId = newRoom.id;
      }

      // Create the asset
      const asset = await createAsset.mutateAsync({
        property_id: propertyId,
        room_id: finalRoomId ?? null,
        name: name.trim(),
        category: category.assetCategory,
        brand: fieldValues.brand?.trim() || null,
        model: fieldValues.model?.trim() || null,
        serial_number: fieldValues.serial_number?.trim() || null,
        retailer: fieldValues.retailer?.trim() || fieldValues.contractor?.trim() || fieldValues.supplier?.trim() || null,
        purchase_date: fieldValues.purchase_date?.trim() || fieldValues.install_date?.trim() || null,
        purchase_price: fieldValues.purchase_price?.trim() ? Number(fieldValues.purchase_price) : (fieldValues.cost?.trim() ? Number(fieldValues.cost) : null),
        warranty_expiry: fieldValues.warranty_expiry?.trim() || null,
        warranty_provider: null,
        notes: fieldValues.description?.trim() || null,
        status: 'active',
        attributes: {
          smart_category: category.id,
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

      // Create reminders
      const activeReminders = category.reminders.filter((_, i) => enabledReminders[i]);
      for (const reminder of activeReminders) {
        const nextDue = calculateNextDue(reminder.frequencyType);
        await createReminder.mutateAsync({
          property_id: propertyId,
          asset_id: asset.id,
          title: `${name.trim()} — ${reminder.title}`,
          description: reminder.description,
          frequency_type: reminder.frequencyType,
          next_due_date: nextDue,
          source: 'user',
        }).catch(() => {}); // Don't fail the whole flow if a reminder fails
      }

      // Check for overdue service warning (boiler)
      if (fieldValues.last_service) {
        const lastService = new Date(fieldValues.last_service);
        const monthsAgo = (Date.now() - lastService.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsAgo > 12) {
          Alert.alert('Service overdue', `Your ${name.trim()} was last serviced ${Math.round(monthsAgo)} months ago. Consider booking a service soon.`);
        }
      }

      router.replace(`/asset/${asset.id}`);
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
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="title1">{category.label}</Text>
            <Text variant="footnote" color="textSecondary">{category.description}</Text>
          </View>
          <Text style={{ fontSize: 32 }}>{category.icon}</Text>
        </View>

        {/* Quick items */}
        {category.quickItems && category.quickItems.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">Quick add</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {category.quickItems.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() => handleQuickItem(item)}
                  style={({ pressed }) => ({
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.radius.md,
                    backgroundColor: name === item ? theme.colors.accent : theme.colors.surfaceAlt,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text variant="body" style={{ color: name === item ? theme.colors.onAccent : theme.colors.textPrimary }}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Name */}
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder={category.quickItems?.[0] ? `e.g. ${category.quickItems[0]}` : 'What is it?'}
        />

        {/* Photo scan offer */}
        {category.offerPhotoScan ? (
          <Card onPress={() => router.push({ pathname: '/capture/scan', params: { propertyId, mode: 'asset' } })}>
            <ListRow
              leading={<Ionicons name="camera-outline" size={22} color={theme.colors.accent} />}
              title="Scan a label or photo"
              subtitle="AI reads the brand, model, and serial number"
              showChevron
            />
          </Card>
        ) : null}

        {/* Room picker */}
        {category.askRoom ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">Where is it? (optional)</Text>
            <ChipSelect options={roomOptions} value={roomId} onChange={setRoomId} />
          </View>
        ) : null}

        {/* Category-specific fields */}
        <View style={{ gap: theme.spacing.sm }}>
          {category.fields.map((field) => {
            if (field.type === 'select' && field.options) {
              return (
                <View key={field.key} style={{ gap: theme.spacing.xs }}>
                  <Text variant="footnote" color="textSecondary">{field.label}</Text>
                  <ChipSelect
                    options={field.options}
                    value={fieldValues[field.key]}
                    onChange={(v) => setField(field.key, v ?? '')}
                  />
                </View>
              );
            }
            return (
              <TextField
                key={field.key}
                label={field.label}
                value={fieldValues[field.key] ?? ''}
                onChangeText={(v) => setField(field.key, v)}
                placeholder={field.placeholder}
                keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
                multiline={field.type === 'multiline'}
                numberOfLines={field.type === 'multiline' ? 3 : 1}
              />
            );
          })}
        </View>

        {/* Smart reminders */}
        {category.reminders.length > 0 ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="headline">Reminders</Text>
            <Text variant="footnote" color="textSecondary">We'll notify you when these are due.</Text>
            {category.reminders.map((reminder, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: theme.spacing.sm,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="body">{reminder.title}</Text>
                  <Text variant="caption" color="textSecondary">
                    {frequencyLabel(reminder.frequencyType)}
                  </Text>
                </View>
                <Switch
                  value={enabledReminders[index]}
                  onValueChange={(v) => setEnabledReminders((prev) => ({ ...prev, [index]: v }))}
                  trackColor={{ true: theme.colors.accent, false: theme.colors.surfaceAlt }}
                />
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

function frequencyLabel(type: string): string {
  switch (type) {
    case 'monthly': return 'Every month';
    case 'quarterly': return 'Every 3 months';
    case 'biannual': return 'Every 6 months';
    case 'annual': return 'Every year';
    case 'once': return 'One-time reminder';
    default: return type;
  }
}

function calculateNextDue(frequencyType: string): string {
  const now = new Date();
  switch (frequencyType) {
    case 'monthly': now.setMonth(now.getMonth() + 1); break;
    case 'quarterly': now.setMonth(now.getMonth() + 3); break;
    case 'biannual': now.setMonth(now.getMonth() + 6); break;
    case 'annual': now.setFullYear(now.getFullYear() + 1); break;
    case 'once': now.setFullYear(now.getFullYear() + 1); break;
  }
  return now.toISOString().slice(0, 10);
}
