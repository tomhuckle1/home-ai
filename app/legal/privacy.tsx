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

export default function PrivacyPolicyScreen() {
  const theme = useTheme();

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Badge label="Draft — not yet legally reviewed" tone="warning" />
        <Text variant="title1">Privacy Policy</Text>
        <P>
          This is a working draft to be reviewed by a qualified lawyer before Home Memory is published — it is not
          legal advice and should not be relied on as-is.
        </P>

        <H>What we collect</H>
        <P>
          Account details (name, email); photos and information you add about your property, its rooms, appliances,
          receipts, manuals, warranties and certificates; questions you ask the AI assistant; and basic usage
          analytics (feature usage, not the content of what you record).
        </P>

        <H>How we use it</H>
        <P>
          To build and display your home&apos;s record, to answer your questions from your own data using AI (OpenAI),
          to process payments (RevenueCat), and to understand product usage in aggregate (PostHog). We do not sell
          your data.
        </P>

        <H>Where it&apos;s stored</H>
        <P>
          In a Supabase project hosted in the EU. Photos and documents are stored privately and are only accessible
          to you and anyone you explicitly invite to your household.
        </P>

        <H>AI processing</H>
        <P>
          Photos you scan and questions you ask are sent to OpenAI to extract information and generate answers.
          OpenAI processes this data to provide the response; it is not used to train their models under our account
          configuration.
        </P>

        <H>Your rights</H>
        <P>
          Under UK GDPR you can access, export and delete your data at any time from Profile → Export my data /
          Delete account. Deleting your account permanently removes every property you own and everything recorded
          under it.
        </P>

        <H>Home Passport sharing</H>
        <P>
          If you generate a Home Passport to share with a buyer, the information in it is accessible to anyone with
          the link until it expires (90 days) or you revoke it.
        </P>

        <H>Contact</H>
        <P>Add a real contact/data-controller email here before publishing.</P>
      </ScrollView>
    </Screen>
  );
}
