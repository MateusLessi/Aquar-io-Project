import { Stack } from 'expo-router';

import { useTheme } from '@/design-system';

export default function HabitsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfaceBase } }}
    />
  );
}
