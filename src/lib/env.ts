import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url({
    message:
      'EXPO_PUBLIC_SUPABASE_URL is missing or invalid. Copy .env.example to .env and fill in your Supabase project URL.',
  }),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message:
      'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Copy .env.example to .env and fill in your Supabase anon key.',
  }),
  EXPO_PUBLIC_POSTHOG_API_KEY: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: z.string().optional(),
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_POSTHOG_API_KEY: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
  EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

if (!parsed.success) {
  const messages = parsed.error.issues.map((issue) => `- ${issue.message}`).join('\n');
  throw new Error(`Home Memory environment is misconfigured:\n${messages}`);
}

export const env = parsed.data;
