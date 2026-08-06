import { ActivityIndicator, FlatList, View } from 'react-native';

import { Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useProfile } from '@/src/hooks/useProfile';
import { useProperties } from '@/src/hooks/useProperties';

export default function HomeScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: properties, isLoading } = useProperties();

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <Screen edges={['top']}>
      <View style={{ paddingVertical: theme.spacing.md }}>
        <Text variant="largeTitle">{firstName ? `Hi ${firstName}` : 'Home'}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={properties ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              icon="🏠"
              title="No properties yet"
              description="Property creation and the guided photo walkthrough land in the next phase of this build."
            />
          }
          renderItem={({ item }) => (
            <Card>
              <ListRow
                title={item.address_line1}
                subtitle={[item.city, item.postcode].filter(Boolean).join(', ') || undefined}
                showChevron
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
