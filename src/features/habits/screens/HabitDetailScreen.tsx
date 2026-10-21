import { useRouter } from 'expo-router';
import { Pencil, SearchX } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { toDateKey } from '@/core/dates';
import {
  EmptyState,
  IconButton,
  Screen,
  Surface,
  Text,
  listColors,
  spacing,
  useTheme,
} from '@/design-system';

import { CreatureBubble } from '../components/CreatureBubble';
import { streakLabel } from '../components/HabitCard';
import { HabitCalendar } from '../components/HabitCalendar';
import { HabitEditorSheet } from '../components/HabitEditorSheet';
import { creatures } from '../domain/creatures';
import { daysLabel } from '../domain/progress';
import { useHabitsRepository } from '../hooks/habitsContext';
import { useHabit } from '../hooks/queries';

export function HabitDetailScreen({ habitId }: { habitId: string }) {
  const router = useRouter();
  const repository = useHabitsRepository();
  const { scheme } = useTheme();
  const { data, loading, todayKey } = useHabit(habitId);
  const [editing, setEditing] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/habits'));

  if (loading) return <Screen title="" onBack={back} />;

  if (!data) {
    return (
      <Screen title="Hábito" onBack={back}>
        <EmptyState
          icon={SearchX}
          title="Este hábito não existe mais"
          message="Ele pode ter sido apagado em outro aparelho."
          action={{ label: 'Ver hábitos', onPress: () => router.replace('/habits') }}
        />
      </Screen>
    );
  }

  const { habit, doneDays } = data;
  const creature = creatures[habit.creature];
  const tone = listColors[creature.color][scheme];
  const toggle = (date: string, done: boolean) =>
    repository.setChecked(habit.id, date, done).catch((e: unknown) => console.error(e));

  return (
    <Screen
      title={habit.name}
      eyebrow={`${creature.name} · ${daysLabel(habit.days)}`}
      onBack={back}
      actions={<IconButton icon={Pencil} label="Editar hábito" onPress={() => setEditing(true)} />}
    >
      <View style={styles.hero}>
        <CreatureBubble creature={habit.creature} size={112} done={habit.doneToday} />
        <Text variant="title2" style={styles.center}>
          {habit.doneToday
            ? 'Feito hoje!'
            : habit.scheduledToday
              ? 'Ainda dá tempo hoje'
              : 'Hoje é dia de descanso'}
        </Text>
        <Text variant="callout" tone="secondary" style={styles.center}>
          {streakLabel(habit)}
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat
          label="Sequência"
          value={String(habit.streak)}
          unit={habit.streak === 1 ? 'dia' : 'dias'}
        />
        <Stat
          label="Melhor"
          value={String(habit.bestStreak)}
          unit={habit.bestStreak === 1 ? 'dia' : 'dias'}
        />
        <Stat
          label="Últimos 30 dias"
          value={habit.consistency === null ? '—' : `${Math.round(habit.consistency * 100)}%`}
        />
      </View>

      <Surface style={styles.calendar}>
        <HabitCalendar
          done={new Set(doneDays)}
          days={habit.days}
          todayKey={todayKey}
          startKey={[toDateKey(new Date(habit.createdAt)), ...doneDays].sort()[0]!}
          tone={tone}
          onToggle={toggle}
        />
      </Surface>
      <Text variant="footnote" tone="tertiary" style={styles.note}>
        Esqueceu de marcar? Toque num dia que já passou para corrigir.
      </Text>

      <HabitEditorSheet
        visible={editing}
        habit={habit}
        onClose={() => setEditing(false)}
        onSubmit={(input) => repository.updateHabit(habit.id, input)}
        onDelete={async () => {
          await repository.deleteHabit(habit.id);
          back();
        }}
      />
    </Screen>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Surface style={styles.stat}>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="title1">{value}</Text>
      {unit ? (
        <Text variant="caption" tone="tertiary">
          {unit}
        </Text>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  center: { textAlign: 'center' },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, padding: spacing.md, gap: 2 },
  calendar: { padding: spacing.md },
  note: { marginLeft: spacing.xs },
});
