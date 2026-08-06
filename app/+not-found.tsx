import { Link, Stack } from 'expo-router';

import { Screen, Text, useTheme } from '@/src/design-system';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen style={{ alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm }}>
        <Text variant="title1">This screen doesn&apos;t exist.</Text>
        <Link href="/">
          <Text variant="body" color="accent">
            Go back home
          </Text>
        </Link>
      </Screen>
    </>
  );
}
