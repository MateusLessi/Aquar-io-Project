import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { toDateKey } from '@/core/dates';
import {
  Button,
  Legend,
  Sparkline,
  Text,
  chartColors,
  radius,
  spacing,
  useTheme,
} from '@/design-system';

import { periodOf } from './computeStats';
import { useStats } from './useStats';

/**
 * "Esta semana" on the dashboard: how much got done (and versus last week), the last days as
 * a small line, and the balance between tasks, habits and routines. Opens the statistics.
 */
export function WeekStatsCard() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const { data } = useStats(periodOf('week', toDateKey(new Date())));
  if (!data) return null;
  const { current, previous } = data;
  const delta = current.totals.all - previous.totals.all;
  const t = current.totals;
  const parts = [
    { label: t.tasks === 1 ? 'tarefa' : 'tarefas', n: t.tasks, color: chartColors.tasks[scheme] },
    {
      label: t.habits === 1 ? 'hábito' : 'hábitos',
      n: t.habits,
      color: chartColors.habits[scheme],
    },
    {
      label: t.routines === 1 ? 'item de rotina' : 'itens de rotina',
      n: t.routines,
      color: chartColors.routines[scheme],
    },
  ];
  const open = () => router.push('/profile/stats');
  const summary = `${t.all} concluídos nesta semana, ${
    delta === 0 ? 'igual à' : `${Math.abs(delta)} ${delta > 0 ? 'a mais que' : 'a menos que'}`
  } semana passada: ${parts.map((p) => `${p.n} ${p.label}`).join(', ')}`;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary" accessibilityRole="header">
          Esta semana
        </Text>
        <Button label="Ver estatísticas" variant="ghost" onPress={open} />
      </View>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${summary}. Abrir estatísticas`}
        style={styles.main}
      >
        <View style={styles.flex}>
          <Text variant="title1" style={styles.number}>
            {t.all}
          </Text>
          <Text variant="footnote" tone="secondary">
            concluídos · {delta > 0 ? '▲' : delta < 0 ? '▼' : '='} {Math.abs(delta)} vs. semana
            passada
          </Text>
        </View>
        <Sparkline
          values={current.byDay
            .filter((d) => !d.future)
            .map((d) => d.tasks + d.habits + d.routines)}
          color={colors.accent}
        />
      </Pressable>
      {t.all > 0 ? (
        <>
          <View style={styles.balance} importantForAccessibility="no-hide-descendants">
            {parts
              .filter((p) => p.n > 0)
              .map((p) => (
                <View key={p.label} style={{ flex: p.n, backgroundColor: p.color }} />
              ))}
          </View>
          <Legend items={parts.map((p) => ({ label: `${p.n} ${p.label}`, color: p.color }))} />
        </>
      ) : (
        <Text variant="footnote" tone="secondary">
          Nada concluído ainda nesta semana. Cada tarefa, hábito e item de rotina entra aqui.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  main: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  flex: { flex: 1 },
  number: { fontVariant: ['tabular-nums'] },
  balance: {
    flexDirection: 'row',
    gap: 2,
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
});
