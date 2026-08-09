import { View } from 'react-native';

// This screen is never shown — the tab press listener in _layout.tsx
// intercepts the tap and opens the camera/upload flow instead.
export default function ScanTab() {
  return <View />;
}
