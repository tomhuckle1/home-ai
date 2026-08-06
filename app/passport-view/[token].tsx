import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Card, Screen, Text, useTheme } from '@/src/design-system';
import { env } from '@/src/lib/env';

type PassportSnapshot = {
  generated_at: string;
  property: {
    address_line1: string;
    address_line2: string | null;
    city: string | null;
    postcode: string | null;
    property_type: string | null;
    tenure: string | null;
    year_built: number | null;
  };
  rooms: { id: string; name: string }[];
  assets: {
    id: string;
    room_id: string | null;
    name: string;
    brand: string | null;
    model: string | null;
    warranty_expiry: string | null;
    photo_url?: string | null;
  }[];
  documents: {
    id: string;
    document_type: string;
    supplier: string | null;
    product_description: string | null;
    document_date: string | null;
  }[];
  contractors: { id: string; name: string; trade: string | null }[];
  timeline: { event_type: string; title: string; event_date: string; cost: number | null }[];
};

export default function PassportViewScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const theme = useTheme();
  const [snapshot, setSnapshot] = useState<PassportSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-passport?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) throw new Error(body.error ?? 'This link is not valid.');
        setSnapshot(body.snapshot);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'This link is not valid.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (error || !snapshot) {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <Text variant="title2" style={{ textAlign: 'center' }}>
          {error ?? 'This link is not valid.'}
        </Text>
      </Screen>
    );
  }

  const { property } = snapshot;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="largeTitle">{property.address_line1}</Text>
          <Text variant="body" color="textSecondary">
            {[property.city, property.postcode].filter(Boolean).join(', ')}
          </Text>
          <Text variant="footnote" color="textTertiary">
            Home Passport — generated {snapshot.generated_at.slice(0, 10)}
          </Text>
        </View>

        <Section title={`Items (${snapshot.assets.length})`}>
          {snapshot.assets.map((asset) => (
            <Card key={asset.id}>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' }}>
                {asset.photo_url ? (
                  <Image source={{ uri: asset.photo_url }} style={{ width: 48, height: 48, borderRadius: theme.radius.sm }} />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text variant="body">{asset.name}</Text>
                  <Text variant="footnote" color="textSecondary">
                    {[asset.brand, asset.model].filter(Boolean).join(' · ') || undefined}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </Section>

        <Section title={`Documents (${snapshot.documents.length})`}>
          {snapshot.documents.map((doc) => (
            <Card key={doc.id}>
              <Text variant="body">{doc.product_description || doc.document_type.replace(/_/g, ' ')}</Text>
              <Text variant="footnote" color="textSecondary">
                {[doc.supplier, doc.document_date].filter(Boolean).join(' · ') || undefined}
              </Text>
            </Card>
          ))}
        </Section>

        <Section title="History">
          {snapshot.timeline.map((event, index) => (
            <Card key={`${event.event_date}-${index}`}>
              <Text variant="body">{event.title}</Text>
              <Text variant="footnote" color="textSecondary">
                {event.event_date}
                {event.cost ? ` · £${event.cost}` : ''}
              </Text>
            </Card>
          ))}
        </Section>

        {snapshot.contractors.length > 0 ? (
          <Section title="Contractors">
            {snapshot.contractors.map((c) => (
              <Card key={c.id}>
                <Text variant="body">{c.name}</Text>
                {c.trade ? (
                  <Text variant="footnote" color="textSecondary">
                    {c.trade}
                  </Text>
                ) : null}
              </Card>
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="headline">{title}</Text>
      {children}
    </View>
  );
}
