import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { supabase } from '@/src/lib/supabase';

export default function SignUpScreen() {
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSignUp() {
    setError(null);
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    track(AnalyticsEvent.SignedUp);

    // Email confirmation may be required depending on the Supabase Auth
    // settings; a session is only returned once it's confirmed (or if
    // confirmation is disabled), so cover both outcomes.
    if (!data.session) {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.xs }}>
          <Text variant="title1">Check your email</Text>
          <Text variant="body" color="textSecondary">
            We&apos;ve sent a confirmation link to {email}. Follow it to finish creating your account.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs, marginBottom: theme.spacing.md }}>
          <Text variant="largeTitle">Create your home&apos;s memory</Text>
          <Text variant="body" color="textSecondary">
            Takes about a minute to set up.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField label="Full name" autoComplete="name" value={fullName} onChangeText={setFullName} />
          <TextField
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            autoCapitalize="none"
            secureTextEntry
            autoComplete="password-new"
            value={password}
            onChangeText={setPassword}
          />
          {error ? (
            <Text variant="footnote" color="danger">
              {error}
            </Text>
          ) : null}
          <Button
            label="Create account"
            onPress={handleSignUp}
            loading={loading}
            disabled={!email || !password}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xxs }}>
          <Text variant="footnote" color="textSecondary">
            Already have an account?
          </Text>
          <Link href="/(auth)/sign-in">
            <Text variant="footnote" color="accent">
              Sign in
            </Text>
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}
