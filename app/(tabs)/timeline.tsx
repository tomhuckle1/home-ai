import { EmptyState, Screen } from '@/src/design-system';

export default function TimelineScreen() {
  return (
    <Screen edges={['top']} style={{ justifyContent: 'center' }}>
      <EmptyState
        icon="🕓"
        title="Timeline"
        description="Your property's chronological history — auto-built from the assets, documents and maintenance you record."
      />
    </Screen>
  );
}
