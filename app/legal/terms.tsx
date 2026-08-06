import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

import { Badge, Screen, Text, useTheme } from '@/src/design-system';

function P({ children }: { children: ReactNode }) {
  return (
    <Text variant="body" color="textSecondary">
      {children}
    </Text>
  );
}

function H({ children }: { children: ReactNode }) {
  return (
    <Text variant="headline" style={{ marginTop: 8 }}>
      {children}
    </Text>
  );
}

export default function TermsOfServiceScreen() {
  const theme = useTheme();

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Badge label="Draft — not yet legally reviewed" tone="warning" />
        <Text variant="title1">Terms of Service</Text>
        <P>
          This is a working draft to be reviewed by a qualified lawyer before Home Memory is published — it is not
          legal advice and should not be relied on as-is.
        </P>

        <H>The service</H>
        <P>
          Home Memory helps you record and recall information about your property. Free and Premium tiers are
          described in-app; Premium is billed through the App Store or Play Store via RevenueCat and renews
          automatically unless cancelled.
        </P>

        <H>Accuracy of AI-extracted information</H>
        <P>
          Details Home Memory reads from your photos (dates, prices, model numbers) are AI-generated best guesses
          you&apos;re asked to confirm. We don&apos;t guarantee their accuracy, and you&apos;re responsible for
          checking anything important (like a warranty or safety-certificate date) against the original document.
        </P>

        <H>Home Passport</H>
        <P>
          Anyone with a Home Passport link can view the information in it until it expires or is revoked. You&apos;re
          responsible for only sharing it with intended recipients.
        </P>

        <H>Acceptable use</H>
        <P>
          Home Memory is for recording information about property you own or have the right to record. Don&apos;t use
          it to store or share unlawful content.
        </P>

        <H>Cancelling</H>
        <P>
          You can cancel a Premium subscription any time via your App Store/Play Store account settings, and delete
          your account and all its data from Profile → Delete account.
        </P>

        <H>Contact</H>
        <P>Add a real contact/support email here before publishing.</P>
      </ScrollView>
    </Screen>
  );
}
