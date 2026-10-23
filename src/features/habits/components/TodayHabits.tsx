import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Text, haptics, spacing } from '@/design-system';

import { useHabitsRepository } from '../hooks/habitsContext';
import { useHabits } from '../hooks/queries';
import { CreatureBubble } from './CreatureBubble';

/** Today's habits as a row of creatures: one tap checks a habit. Hidden when none is due. */
export function TodayHabits() {
  const router = useRouter();
  const repository = useHabitsRepository();
  const { data: habits = [], todayKey } = useHabits();
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  if (due.length === 0) return null;
  const done = due.filter((h) => h.doneToday).length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary" style={styles.title}>
          Hábitos · {done} de {due.length}
        </Text>
        <Button
          label="Ver todos"
          variant="ghost"
          onPress={() => router.navigate({ pathname: '/aquarium', params: { tab: 'habits' } })}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {due.map((habit) => (
          <Pressable
            key={habit.id}
            onPress={() => {
              if (habit.doneToday) haptics.selection();
              else haptics.success();
              repository
                .setChecked(habit.id, todayKey, !habit.doneToday)
                .catch((e: unknown) => console.error(e));
            }}
            accessibilityRole="checkbox"
            accessibilityLabel={`${habit.name}: feito hoje`}
            accessibilityState={{ checked: habit.doneToday }}
            aria-checked={habit.doneToday}
            style={({ pressed }) => [styles.item, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
          >
            <CreatureBubble
              creature={habit.creature}
              stage={habit.stage}
              size={64}
              done={habit.doneToday}
            />
            <Text
              variant="caption"
              tone={habit.doneToday ? 'primary' : 'secondary'}
              numberOfLines={1}
              style={styles.name}
            >
              {habit.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginLeft: spacing.xs },
  row: { gap: spacing.md, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  item: { alignItems: 'center', gap: spacing.xs, width: 76 },
  name: { textAlign: 'center', width: 76 },
});
