import * as AppleAuthentication from 'expo-apple-authentication';

import { supabase } from './supabase';

export class AppleSignInCancelledError extends Error {}

export async function signInWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token.');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;

    return credential;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
      throw new AppleSignInCancelledError('Sign in with Apple was cancelled.');
    }
    throw error;
  }
}
