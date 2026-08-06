import * as AppleAuthentication from 'expo-apple-authentication';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';

import { Button, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { AppleSignInCancelledError, signInWithApple } from '@/src/lib/auth-providers';
import { supabase } from '@/src/lib/supabase';

export default function SignInScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    }
  }

  async function handleAppleSignIn() {
    setError(null);
    try {
      await signInWithApple();
    } catch (err) {
      if (err instanceof AppleSignInCancelledError) return;
      setError(err instanceof Error ? err.message : 'Sign in with Apple failed.');
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs, marginBottom: theme.spacing.md }}>
          <Text variant="largeTitle">Welcome back</Text>
          <Text variant="body" color="textSecondary">
            The AI-powered memory of your home.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
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
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />
          {error ? (
            <Text variant="footnote" color="danger">
              {error}
            </Text>
          ) : null}
          <Button label="Sign in" onPress={handleSignIn} loading={loading} disabled={!email || !password} />
        </View>

        {Platform.OS === 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              theme.scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={theme.radius.md}
            style={{ height: 48 }}
            onPress={handleAppleSignIn}
          />
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xxs }}>
          <Text variant="footnote" color="textSecondary">
            New to Home Memory?
          </Text>
          <Link href="/(auth)/sign-up">
            <Text variant="footnote" color="accent">
              Create an account
            </Text>
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}
