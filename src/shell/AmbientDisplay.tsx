import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { DeepSurface, Text, TideHero, spacing } from '@/design-system';
import { CreatureBubble } from '@/features/habits/components/CreatureBubble';
import { useHabits } from '@/features/habits/hooks/queries';
import { useToday } from '@/features/todo/hooks/queries';

type AmbientDisplayProps = {
  /** Degrees that make the content upright for how the phone is held. */
  rotation: number;
  onExit: () => void;
};

function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Modo Maré: the phone lying sideways on its charger shows the time, the day's tide and
 * what is next. The screen stays awake while it is shown. Any tap exits.
 * Later etapas add habits and creatures here.
 */
export function AmbientDisplay({ rotation, onExit }: AmbientDisplayProps) {
  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onExit}
    >
      <AmbientContent rotation={rotation} onExit={onExit} />
    </Modal>
  );
}

export function AmbientContent({ rotation, onExit }: AmbientDisplayProps) {
  useKeepAwake('ambient-display');
  const now = useClock();
  const { width, height } = useWindowDimensions();
  const { data: tasks = [] } = useToday(now);
  const { data: habits = [] } = useHabits(now);
  const dueHabits = habits.filter((h) => h.scheduledToday || h.doneToday);
  const sideways = rotation !== 0;
  // The UI is locked in portrait, so lay the landscape content out rotated.
  const box = sideways ? { width: height, height: width } : { width, height };

  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(now);
  const date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
  const completed = tasks.filter((t) => t.completedAt).length;
  const next = tasks.filter((t) => !t.completedAt).slice(0, 3);

  return (
    <Pressable
      style={styles.root}
      onPress={onExit}
      accessibilityRole="button"
      accessibilityLabel="Sair do Modo Maré"
    >
      <DeepSurface radius="none" style={StyleSheet.absoluteFill} />
      <View style={styles.center} pointerEvents="none">
        <View style={[box, styles.stage, { transform: [{ rotate: `${rotation}deg` }] }]}>
          <View style={styles.clock}>
            <Text variant="display" tone="onDeep" style={styles.time} accessibilityRole="timer">
              {time}
            </Text>
            <Text variant="title2" tone="onDeepSecondary">
              {date.charAt(0).toUpperCase() + date.slice(1)}
            </Text>
            {next.length > 0 ? (
              <View style={styles.next}>
                <Text variant="overline" tone="onDeepSecondary">
                  A seguir
                </Text>
                {next.map((task) => (
                  <Text key={task.id} variant="headline" tone="onDeep" numberOfLines={1}>
                    {task.listEmoji ? `${task.listEmoji}  ` : '•  '}
                    {task.title}
                  </Text>
                ))}
              </View>
            ) : null}
            {dueHabits.length > 0 ? (
              <View style={styles.habits}>
                {dueHabits.slice(0, 6).map((habit) => (
                  <CreatureBubble
                    key={habit.id}
                    creature={habit.creature}
                    stage={habit.stage}
                    size={44}
                    done={habit.doneToday}
                  />
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.tide}>
            <TideHero
              label="Maré do dia"
              completed={completed}
              total={tasks.length}
              caption="tarefas concluídas"
              emptyMessage="Mar calmo hoje."
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxl,
    gap: spacing.huge,
  },
  clock: { flex: 1.2, gap: spacing.xs },
  time: { fontSize: 112, lineHeight: 116, letterSpacing: -4 },
  next: { marginTop: spacing.xxl, gap: spacing.sm },
  habits: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tide: { flex: 1 },
});
