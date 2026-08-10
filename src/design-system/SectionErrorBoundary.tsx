import { Component, type PropsWithChildren, type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './Text';

type Props = PropsWithChildren<{ fallback?: ReactNode }>;
type State = { hasError: boolean };

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <View style={{ padding: 12, alignItems: 'center' }}>
          <Text variant="footnote" color="textTertiary">Something went wrong loading this section.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
