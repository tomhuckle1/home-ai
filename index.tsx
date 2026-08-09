import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { Button, Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useContractors } from '@/src/hooks/useContractors';

export default function ContractorListScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const theme = useTheme();
  const { data: contractors, isLoading, refetch, isRefetching } = useContractors(propertyId);

  return (
    <Screen edges={['bottom']}>
      <View
        style={{
          paddingVertical: theme.spacing.md,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="title1">Contractors</Text>
        <Button
          label="Add"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.push({ pathname: '/contractor/new', params: { propertyId } })}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={contractors ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🔧"
              title="No contractors saved"
              description="Keep a record of the tradespeople who've worked on your home — plumbers, electricians, builders."
              actionLabel="Add a contractor"
              onAction={() => router.push({ pathname: '/contractor/new', params: { propertyId } })}
            />
          }
          renderItem={({ item }) => (
            <Card>
              <ListRow
                leading={
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: theme.colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="construct-outline" size={18} color={theme.colors.textSecondary} />
                  </View>
                }
                title={item.name}
                subtitle={[item.trade, item.phone].filter(Boolean).join(' · ') || undefined}
                showChevron
                onPress={() => router.push(`/contractor/${item.id}`)}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
