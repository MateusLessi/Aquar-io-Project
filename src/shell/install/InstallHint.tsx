import { Share, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Surface, Text, radius, spacing, useTheme } from '@/design-system';

import { needsInstallHint } from './installHint';

const KEY = 'aquario.installHint';

function readEnv() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return null;
  let dismissed = false;
  try {
    dismissed = globalThis.localStorage?.getItem(KEY) === 'dismissed';
  } catch {
    // Blocked storage: show it, and it closes for this visit.
  }
  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    standalone:
      (navigator as { standalone?: boolean }).standalone === true ||
      globalThis.matchMedia?.('(display-mode: standalone)').matches === true,
    dismissed,
  };
}

/** On iPhone Safari, once: how to put Aquar.io on the home screen, like an app. */
export function InstallHint() {
  const { colors } = useTheme();
  const [show, setShow] = useState(() => {
    const env = readEnv();
    return env ? needsInstallHint(env) : false;
  });
  if (!show) return null;

  const close = () => {
    setShow(false);
    try {
      globalThis.localStorage?.setItem(KEY, 'dismissed');
    } catch {
      // Nothing to remember it with: it just stays closed for now.
    }
  };

  return (
    <Surface style={styles.card}>
      <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
        <Share size={18} color={colors.accent} />
      </View>
      <View style={styles.flex}>
        <Text variant="bodyStrong">Use como app</Text>
        <Text variant="footnote" tone="secondary">
          Toque em Compartilhar e em Adicionar à Tela de Início.
        </Text>
      </View>
      <Pressable
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="Fechar dica"
        hitSlop={12}
        style={styles.close}
      >
        <X size={18} color={colors.textTertiary} />
      </Pressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  close: { padding: spacing.xs },
});
