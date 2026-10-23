import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { CloudAlert } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { appFonts, EmptyState, OceanBackground, ThemeProvider, useTheme } from '@/design-system';
import {
  AppDataProvider,
  saveAccessibility,
  saveThemePreference,
  useAppDataBootstrap,
} from '@/shell/AppData';

// Keep the splash screen until fonts and data are ready, so nothing flashes.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const boot = useAppDataBootstrap();
  const fontsSettled = fontsLoaded || Boolean(fontError);
  const settled = fontsSettled && boot.status !== 'loading';

  useEffect(() => {
    if (fontError) console.warn('Fonts failed to load; falling back to system fonts.', fontError);
    if (boot.status === 'error') console.error('Could not open the database.', boot.error);
    if (settled) SplashScreen.hideAsync().catch(() => {});
  }, [fontError, boot, settled]);

  if (!settled) return null;

  if (boot.status !== 'ready') {
    return (
      <ThemeProvider>
        <StartupError onRetry={boot.status === 'error' ? boot.retry : undefined} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      initialPreference={boot.data.themePreference}
      initialAccessibility={boot.data.accessibility}
      onAccessibilityChange={(key, value) => {
        saveAccessibility(boot.data, key, value).catch((error: unknown) =>
          console.warn('Could not save the accessibility choice.', error),
        );
      }}
      onPreferenceChange={(preference) => {
        saveThemePreference(boot.data, preference).catch((error: unknown) =>
          console.warn('Could not save the theme preference.', error),
        );
      }}
    >
      <AppDataProvider data={boot.data}>
        <ThemedStack />
      </AppDataProvider>
    </ThemeProvider>
  );
}

function ThemedStack() {
  const { scheme, colors } = useTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surfaceBase },
        }}
      />
    </>
  );
}

function StartupError({ onRetry }: { onRetry?: () => void }) {
  return (
    <OceanBackground>
      <View style={styles.center}>
        <EmptyState
          icon={CloudAlert}
          title="Não foi possível abrir seus dados"
          message="Algo impediu o Aquar.io de abrir o banco de dados neste aparelho. Seus dados não foram apagados."
          action={onRetry ? { label: 'Tentar de novo', onPress: onRetry } : undefined}
        />
      </View>
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
