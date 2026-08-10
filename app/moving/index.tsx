import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { Card, ProgressRing, Screen, Text, useTheme } from '@/src/design-system';

type ChecklistItem = { id: string; title: string; subtitle: string; icon: string };

const BEFORE_MOVING: ChecklistItem[] = [
  { id: 'meters', title: 'Take meter readings', subtitle: 'Gas, electric, water — photo each one', icon: '📊' },
  { id: 'stopcock', title: 'Locate and record stopcock', subtitle: 'Make sure you know where the water shut-off is', icon: '🔧' },
  { id: 'fuse-box', title: 'Photo the fuse box', subtitle: 'Record which switch controls what', icon: '⚡' },
  { id: 'boiler', title: 'Record boiler details', subtitle: 'Brand, model, last service date', icon: '🔥' },
  { id: 'alarms', title: 'Check smoke & CO alarms', subtitle: 'Test all alarms, note battery types', icon: '🛡️' },
  { id: 'keys', title: 'Collect all keys', subtitle: 'Front, back, garage, windows, shed, alarm code', icon: '🔑' },
  { id: 'insurance', title: 'Set up home insurance', subtitle: 'Buildings and contents from day one', icon: '📋' },
  { id: 'broadband', title: 'Arrange broadband', subtitle: 'Book installation or transfer', icon: '📡' },
];

const FIRST_WEEK: ChecklistItem[] = [
  { id: 'locks', title: 'Change the locks', subtitle: 'You don\'t know who has keys to the old locks', icon: '🔐' },
  { id: 'rooms', title: 'Name your rooms', subtitle: 'Set up rooms in HomeAI to organise everything', icon: '🚪' },
  { id: 'appliances', title: 'Record your appliances', subtitle: 'Scan labels on oven, dishwasher, washing machine', icon: '📦' },
  { id: 'paint', title: 'Note paint colours', subtitle: 'Before you paint over them — photograph the tins', icon: '🎨' },
  { id: 'council-tax', title: 'Register for council tax', subtitle: 'Notify your local council of the move', icon: '🏛️' },
  { id: 'gp', title: 'Register with a GP', subtitle: 'Find your nearest surgery', icon: '🏥' },
];

const FIRST_MONTH: ChecklistItem[] = [
  { id: 'gas-check', title: 'Book a gas safety check', subtitle: 'Especially if the last certificate is old', icon: '🔥' },
  { id: 'electrics', title: 'Check electrics', subtitle: 'EICR if the property is old or you\'re unsure', icon: '⚡' },
  { id: 'epc', title: 'Check your EPC', subtitle: 'See energy improvement recommendations', icon: '🌱' },
  { id: 'neighbours', title: 'Meet the neighbours', subtitle: 'Introduce yourself, swap numbers', icon: '👋' },
  { id: 'contractors', title: 'Find local tradespeople', subtitle: 'Plumber, electrician, handyman for future needs', icon: '🔧' },
];

export default function MovingChecklistScreen() {
  const theme = useTheme();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const allItems = [...BEFORE_MOVING, ...FIRST_WEEK, ...FIRST_MONTH];
  const progress = Math.round((completed.size / allItems.length) * 100);

  function toggle(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="title1">Moving house</Text>
            <Text variant="footnote" color="textSecondary">{completed.size} of {allItems.length} done</Text>
          </View>
          <ProgressRing value={progress} size={48} label={`${progress}%`} tone={progress >= 80 ? 'accent' : progress >= 40 ? 'warning' : 'danger'} />
        </View>

        <ChecklistSection title="Before you move in" items={BEFORE_MOVING} completed={completed} onToggle={toggle} />
        <ChecklistSection title="First week" items={FIRST_WEEK} completed={completed} onToggle={toggle} />
        <ChecklistSection title="First month" items={FIRST_MONTH} completed={completed} onToggle={toggle} />
      </ScrollView>
    </Screen>
  );
}

function ChecklistSection({ title, items, completed, onToggle }: { title: string; items: ChecklistItem[]; completed: Set<string>; onToggle: (id: string) => void }) {
  const theme = useTheme();
  const sectionDone = items.filter((i) => completed.has(i.id)).length;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="headline">{title}</Text>
        <Text variant="caption" color="textSecondary">{sectionDone}/{items.length}</Text>
      </View>
      {items.map((item, index) => {
        const isDone = completed.has(item.id);
        return (
          <Animated.View key={item.id} entering={FadeInDown.delay(index * 40).duration(300)} layout={Layout.springify()}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onToggle(item.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: isDone ? theme.colors.accent : theme.colors.border,
                padding: theme.spacing.sm,
                opacity: pressed ? 0.7 : isDone ? 0.6 : 1,
              })}
            >
              <Ionicons name={isDone ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={isDone ? theme.colors.accent : theme.colors.textTertiary} />
              <Text style={{ fontSize: 20, lineHeight: 24 }}>{item.icon}</Text>
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="body" style={{ textDecorationLine: isDone ? 'line-through' : 'none' }}>{item.title}</Text>
                <Text variant="caption" color="textSecondary">{item.subtitle}</Text>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
