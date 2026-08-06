import { EmptyState, Screen } from '@/src/design-system';

export default function AskAiScreen() {
  return (
    <Screen edges={['top']} style={{ justifyContent: 'center' }}>
      <EmptyState
        icon="💬"
        title="Ask AI"
        description="A grounded assistant that answers from your own home records, with citations — arriving in the intelligence-layer phase of this build."
      />
    </Screen>
  );
}
