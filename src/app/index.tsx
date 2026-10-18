// TEMPORARY: placeholder screen until the app shell (Etapa 3).
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, OceanBackground, Text, spacing } from '@/design-system';

export default function HomeScreen() {
  return (
    <OceanBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="largeTitle">Aquar.io</Text>
          <Text variant="callout" tone="secondary">
            Design System · Aquatic Glass
          </Text>
        </View>
        {__DEV__ ? (
          <Link href="/dev/design-system" asChild>
            <Button label="Abrir catálogo de componentes" variant="secondary" />
          </Link>
        ) : null}
      </SafeAreaView>
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
