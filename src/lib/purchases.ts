import { Platform } from 'react-native';

import { env } from './env';

// react-native-purchases is a native module — it isn't included in Expo
// Go, only in a custom dev/production build. Importing it dynamically
// (rather than at module top-level) means the rest of the app keeps
// working in Expo Go even though this feature can't; only code paths
// that actually reach the paywall touch this module at all.
async function loadPurchasesModule() {
  const mod = await import('react-native-purchases');
  return mod.default;
}

let configuredForUserId: string | null = null;

function apiKeyForPlatform(): string | undefined {
  return Platform.OS === 'ios' ? env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
}

export class PurchasesUnavailableError extends Error {}

/** appUserId should be the household id — subscriptions are household-scoped (see decisions D1/D6). */
export async function ensurePurchasesConfigured(appUserId: string) {
  const apiKey = apiKeyForPlatform();
  if (!apiKey) {
    throw new PurchasesUnavailableError('RevenueCat is not configured for this platform yet.');
  }
  if (configuredForUserId === appUserId) return;

  const Purchases = await loadPurchasesModule();
  Purchases.configure({ apiKey, appUserID: appUserId });
  configuredForUserId = appUserId;
}

export async function fetchCurrentOffering(appUserId: string) {
  await ensurePurchasesConfigured(appUserId);
  const Purchases = await loadPurchasesModule();
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(appUserId: string, pkg: import('react-native-purchases').PurchasesPackage) {
  await ensurePurchasesConfigured(appUserId);
  const Purchases = await loadPurchasesModule();
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases(appUserId: string) {
  await ensurePurchasesConfigured(appUserId);
  const Purchases = await loadPurchasesModule();
  return Purchases.restorePurchases();
}
