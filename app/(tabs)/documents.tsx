import { EmptyState, Screen } from '@/src/design-system';

export default function DocumentsScreen() {
  return (
    <Screen edges={['top']} style={{ justifyContent: 'center' }}>
      <EmptyState
        icon="📄"
        title="Documents"
        description="Scan receipts, manuals, warranties and certificates — AI will read and file them for you. Coming in the capture phase of this build."
      />
    </Screen>
  );
}
