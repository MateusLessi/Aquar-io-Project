import { useRouter } from 'expo-router';
import { CalendarDays, Sprout } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text, spacing, useTheme } from '@/design-system';
import { amountLabel } from '@/features/habits/domain/amount';
import { useHabits } from '@/features/habits/hooks/queries';
import { eventEntry, withPhase } from '@/features/routines/domain/agenda';
import { durationLabel, onDay, routinesOn } from '@/features/routines/domain/schedule';
import { useAgendaEvents, useRoutinesToday } from '@/features/routines/hooks/queries';

import { habitOfTheMoment, nextOnAgenda } from '../nav/now';
import { Tile } from './Tile';

/** Phones: today's habits as a number, and the next one to do. */
export function MiniHabits() {
  const router = useRouter();
  const { data: habits = [], todayKey } = useHabits();
  const now = new Date();
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  const done = due.filter((h) => h.doneToday).length;
  const next = habitOfTheMoment(habits, todayKey, now.getHours() * 60 + now.getMinutes());
  const line = next
    ? `${next.name}${(() => {
        const amount = amountLabel(next, next.today.amount);
        return amount ? ` · ${amount}` : '';
      })()}`
    : due.length > 0
      ? 'Tudo feito hoje'
      : 'Nenhum para hoje';
  return (
    <View style={styles.half}>
      <Tile
        fill
        label={`Hábitos: ${done} de ${due.length}. ${line}. Abrir hábitos`}
        onPress={() => router.navigate({ pathname: '/aquarium', params: { tab: 'habits' } })}
      >
        <Mini icon={Sprout} title="Hábitos" big={`${done} de ${due.length}`} line={line} />
      </Tile>
    </View>
  );
}

/** Phones: what is on (or next) on today's agenda. */
export function MiniNow() {
  const router = useRouter();
  const { data: routines = [], todayKey, nowMinutes } = useRoutinesToday();
  const { data: events = [] } = useAgendaEvents();
  const next = nextOnAgenda([
    ...routines.map((r) => onDay(r, todayKey)),
    ...routinesOn(
      events.map((e) => withPhase(eventEntry(e), todayKey, nowMinutes)),
      todayKey,
    ),
  ]);
  const line = next
    ? next.phase === 'now'
      ? `faltam ${durationLabel(next.minutesLeft)}`
      : `em ${durationLabel(next.minutesLeft)}`
    : 'Nada mais hoje';
  return (
    <View style={styles.half}>
      <Tile
        fill
        label={`Agora: ${next ? `${next.name}, ${line}` : line}. Abrir a agenda`}
        onPress={() => router.navigate({ pathname: '/aquarium', params: { tab: 'routines' } })}
      >
        <Mini
          icon={CalendarDays}
          title={next?.phase === 'now' ? 'Agora' : 'A seguir'}
          big={next?.name ?? 'Livre'}
          line={line}
          small
        />
      </Tile>
    </View>
  );
}

function Mini({
  icon: Icon,
  title,
  big,
  line,
  small = false,
}: {
  icon: LucideIcon;
  title: string;
  big: string;
  line: string;
  /** A name instead of a number. */
  small?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.mini} importantForAccessibility="no-hide-descendants">
      <View style={styles.head}>
        <Icon size={14} color={colors.textTertiary} />
        <Text variant="overline" tone="tertiary">
          {title}
        </Text>
      </View>
      <Text variant={small ? 'headline' : 'title1'} numberOfLines={1}>
        {big}
      </Text>
      <Text variant="footnote" tone="secondary" numberOfLines={1}>
        {line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  half: { flex: 1, minWidth: 0 },
  mini: { gap: spacing.xxs, paddingRight: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
