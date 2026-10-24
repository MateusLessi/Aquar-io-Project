import { useRouter } from 'expo-router';
import { ChevronDown, Folder, Link2, ListTodo, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { useLinks } from '@/core/links/linksContext';
import {
  Checkbox,
  ConfirmDialog,
  IconButton,
  Text,
  haptics,
  listColors,
  radius,
  specular,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';
import { HabitCapsule } from '@/features/habits/components/HabitCapsule';
import { HabitControl, useLiveAmount } from '@/features/habits/components/HabitCard';
import { amountLabel } from '@/features/habits/domain/amount';
import { creatures } from '@/features/habits/domain/creatures';
import type { HabitWithProgress } from '@/features/habits/domain/types';
import { useHabitActions } from '@/features/habits/hooks/useHabitActions';
import { durationLabel } from '@/features/routines/domain/schedule';
import type { RoutineToday } from '@/features/routines/domain/types';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import type { TaskList } from '@/features/todo/domain/types';
import { useListTasks } from '@/features/todo/hooks/queries';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { HabitTimeSheet, type HabitTimeRequest } from './HabitTimeSheet';
import type { Connected } from './useConnected';

type RoutinePieceProps = {
  routine: RoutineToday;
  inside: Connected[];
  todayKey: string;
  onEdit: () => void;
  /** "+ Conectar algo a esta peça". */
  onConnect: () => void;
  /** Opened at first (e.g. the routine happening now). */
  initiallyOpen?: boolean;
};

/** "3 passos", "18:10 Beber água"…: what the closed piece promises inside. */
function badges(routine: RoutineToday, inside: Connected[]): string[] {
  const out: string[] = [];
  if (routine.items.length > 0) {
    const done = routine.items.filter((i) => i.done).length;
    out.push(`✓ ${done}/${routine.items.length} passos`);
  }
  for (const c of inside.filter((c) => c.kind === 'habit').slice(0, 2)) {
    if (c.kind === 'habit') {
      out.push(
        `${creatures[c.habit.creature].emoji} ${c.habit.name}${c.link.at ? ` ${c.link.at}` : ''}`,
      );
    }
  }
  const moreHabits = inside.filter((c) => c.kind === 'habit').length - 2;
  if (moreHabits > 0) out.push(`+${moreHabits} hábitos`);
  const lists = inside.filter((c) => c.kind === 'list').length;
  if (lists > 0) out.push(`📋 ${lists} ${lists === 1 ? 'lista' : 'listas'}`);
  const folders = inside.filter((c) => c.kind === 'folder').length;
  if (folders > 0) out.push(`📁 ${folders} ${folders === 1 ? 'pasta' : 'pastas'}`);
  return out;
}

/**
 * A routine as a piece of the day. Closed, it shows badges of what it holds and a raised tab
 * inviting to open it; open, it unfolds its steps, the habits placed in it (with their own
 * controls: checking here checks the habit everywhere) and its lists.
 */
export function RoutinePiece({
  routine,
  inside,
  todayKey,
  onEdit,
  onConnect,
  initiallyOpen = false,
}: RoutinePieceProps) {
  const router = useRouter();
  const links = useLinks();
  const routines = useRoutinesRepository();
  const actions = useHabitActions(todayKey);
  const { colors, scheme } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const [timing, setTiming] = useState<(HabitTimeRequest & { linkId: string }) | null>(null);
  const [unlinking, setUnlinking] = useState<{ id: string; name: string } | null>(null);
  const tone = listColors[routine.color][scheme];
  const now = routine.phase === 'now';
  const status =
    routine.phase === 'now'
      ? `Agora · até ${routine.end}`
      : routine.phase === 'upcoming'
        ? `${routine.start}–${routine.end} · em ${durationLabel(routine.minutesLeft)}`
        : `${routine.start}–${routine.end}`;
  const tags = badges(routine, inside);
  const toggle = () => {
    haptics.selection();
    setOpen((v) => !v);
  };
  const report = (e: unknown) => console.error(e);

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20)}
      style={[
        styles.piece,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: withAlpha(tone, now ? 0.75 : 0.4),
          shadowColor: colors.shadow,
          opacity: routine.phase === 'rest' ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.round,
          {
            backgroundColor: withAlpha(
              tone,
              scheme === 'dark' ? (now ? 0.26 : 0.16) : now ? 0.18 : 0.1,
            ),
          },
        ]}
      />
      <View
        style={[
          styles.shine,
          { backgroundColor: withAlpha(specular, scheme === 'dark' ? 0.1 : 0.6) },
        ]}
      />

      <View style={styles.head}>
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={`${routine.name}, ${status}${tags.length ? `, ${tags.join(', ')}` : ''}`}
          accessibilityState={{ expanded: open }}
          accessibilityHint={open ? 'Fecha a peça' : 'Abre a peça'}
          style={styles.headMain}
        >
          <View style={[styles.emoji, { backgroundColor: withAlpha(tone, 0.28) }]}>
            <Text variant="title2">{routine.emoji ?? '⏱️'}</Text>
          </View>
          <View style={styles.flex}>
            <Text variant="headline" numberOfLines={1}>
              {routine.name}
            </Text>
            <Text variant="footnote" tone="secondary">
              {status}
            </Text>
          </View>
        </Pressable>
        <IconButton icon={Pencil} label={`Editar ${routine.name}`} onPress={onEdit} />
      </View>

      {!open && tags.length > 0 ? (
        <View style={styles.badges}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[styles.badge, { backgroundColor: withAlpha(colors.textPrimary, 0.08) }]}
            >
              <Text variant="caption" numberOfLines={1}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {open ? (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(150)}
          style={styles.body}
        >
          {routine.items.length > 0 ? (
            <Group title="Passos">
              {routine.items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <Checkbox
                    checked={item.done}
                    label={item.title}
                    onChange={(done) =>
                      routines.setItemChecked(routine.id, item.id, todayKey, done).catch(report)
                    }
                  />
                  <Text variant="body" struck={item.done} style={styles.flex}>
                    {item.title}
                  </Text>
                </View>
              ))}
            </Group>
          ) : null}

          {inside.some((c) => c.kind === 'habit') ? (
            <Group title="Hábitos">
              {inside.map((c) =>
                c.kind === 'habit' ? (
                  <HabitInPiece
                    key={c.link.id}
                    habit={c.habit}
                    at={c.link.at}
                    actions={actions}
                    onTime={() =>
                      setTiming({
                        linkId: c.link.id,
                        habitName: c.habit.name,
                        routineName: routine.name,
                        start: routine.start,
                        end: routine.end,
                        at: c.link.at,
                      })
                    }
                    onUnlink={() => setUnlinking({ id: c.link.id, name: c.habit.name })}
                  />
                ) : null,
              )}
            </Group>
          ) : null}

          {inside.map((c) =>
            c.kind === 'list' ? (
              <ListInPiece
                key={c.link.id}
                list={c.list}
                onOpen={() =>
                  router.push({ pathname: '/aquarium/lists/[id]', params: { id: c.list.id } })
                }
                onUnlink={() => setUnlinking({ id: c.link.id, name: c.list.name })}
              />
            ) : c.kind === 'folder' ? (
              <Pressable
                key={c.link.id}
                onPress={() =>
                  router.push({ pathname: '/aquarium/folders/[id]', params: { id: c.folder.id } })
                }
                onLongPress={() => setUnlinking({ id: c.link.id, name: c.folder.name })}
                accessibilityRole="button"
                accessibilityLabel={`Pasta ${c.folder.name}, ${c.folder.openCount} pendentes. Abrir`}
                style={styles.row}
              >
                <Folder size={18} color={tone} />
                <Text variant="body" style={styles.flex} numberOfLines={1}>
                  {c.folder.emoji ? `${c.folder.emoji} ` : ''}
                  {c.folder.name}
                </Text>
                <Text variant="footnote" tone="secondary">
                  {c.folder.openCount} pendentes
                </Text>
              </Pressable>
            ) : null,
          )}

          {routine.items.length === 0 && inside.length === 0 ? (
            <Text variant="footnote" tone="secondary">
              Peça vazia. Coloque passos, hábitos ou listas nela.
            </Text>
          ) : null}

          <Pressable
            onPress={onConnect}
            accessibilityRole="button"
            accessibilityLabel={`Conectar algo a ${routine.name}`}
            style={({ pressed }) => [
              styles.connect,
              { borderColor: withAlpha(colors.accent, 0.45) },
              pressed && { backgroundColor: colors.accentSoft },
            ]}
          >
            <Link2 size={16} color={colors.accent} />
            <Text variant="callout" tone="accent" style={styles.bold}>
              Conectar algo a esta peça
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* The raised tab: invites to open, or to close. */}
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={open ? `Fechar ${routine.name}` : `Abrir ${routine.name}`}
        hitSlop={10}
        style={[styles.lip, { backgroundColor: withAlpha(tone, 0.5), shadowColor: colors.shadow }]}
      >
        <ChevronDown
          size={14}
          color={colors.textPrimary}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      <HabitTimeSheet
        request={timing}
        onClose={() => setTiming(null)}
        onConfirm={(at) => {
          if (timing) links.setTime(timing.linkId, at).catch(report);
          setTiming(null);
        }}
      />
      <ConfirmDialog
        visible={unlinking !== null}
        title={`Tirar “${unlinking?.name ?? ''}” desta peça?`}
        message="Só desliga: nada é apagado."
        confirmLabel="Tirar"
        onConfirm={() => {
          if (unlinking) links.unlink(unlinking.id).catch(report);
          setUnlinking(null);
        }}
        onCancel={() => setUnlinking(null)}
      />
    </Animated.View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="overline" tone="tertiary">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function HabitInPiece({
  habit,
  at,
  actions,
  onTime,
  onUnlink,
}: {
  habit: HabitWithProgress;
  at: string | null;
  actions: ReturnType<typeof useHabitActions>;
  onTime: () => void;
  onUnlink: () => void;
}) {
  const { scheme } = useTheme();
  const tone = listColors[creatures[habit.creature].color][scheme];
  const amount = useLiveAmount(habit);
  const label = amountLabel(habit, amount);
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onTime}
        accessibilityRole="button"
        accessibilityLabel={at ? `Horário ${at}. Mudar` : 'Sem horário. Escolher'}
        hitSlop={6}
        style={styles.time}
      >
        <Text variant="caption" tone={at ? 'secondary' : 'tertiary'} style={styles.bold}>
          {at ?? '––:––'}
        </Text>
      </Pressable>
      <HabitCapsule
        creature={habit.creature}
        stage={habit.stage}
        ratio={habit.today.ratio}
        done={habit.doneToday}
        width={34}
        height={44}
      />
      <Pressable
        onPress={() => actions.open(habit)}
        onLongPress={onUnlink}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}${label ? `, ${label}` : ''}. Abrir`}
        accessibilityActions={[{ name: 'longpress', label: 'Tirar desta peça' }]}
        onAccessibilityAction={onUnlink}
        style={styles.flex}
      >
        <Text variant="body" numberOfLines={1} struck={habit.doneToday && habit.kind === 'check'}>
          {habit.name}
          {label ? (
            <Text variant="footnote" tone="secondary">
              {'  '}
              {label}
            </Text>
          ) : null}
        </Text>
      </Pressable>
      <HabitControl habit={habit} tone={tone} actions={actions} size={38} />
    </View>
  );
}

export function ListInPiece({
  list,
  onOpen,
  onUnlink,
}: {
  list: TaskList;
  onOpen: () => void;
  onUnlink: () => void;
}) {
  const todo = useTodo();
  const { colors, scheme } = useTheme();
  const { data: tasks = [] } = useListTasks(list.id);
  const tone = list.color ? listColors[list.color][scheme] : colors.accent;
  const open = tasks.filter((t) => !t.completedAt).slice(0, 5);
  return (
    <View style={styles.group}>
      <Pressable
        onPress={onOpen}
        onLongPress={onUnlink}
        accessibilityRole="button"
        accessibilityLabel={`Lista ${list.name}, ${list.pendingCount} pendentes. Abrir`}
        accessibilityActions={[{ name: 'longpress', label: 'Tirar desta peça' }]}
        onAccessibilityAction={onUnlink}
        style={styles.listHead}
      >
        <ListTodo size={16} color={tone} />
        <Text variant="overline" style={{ color: tone }} numberOfLines={1}>
          {list.emoji ? `${list.emoji} ` : ''}
          Lista · {list.name}
        </Text>
      </Pressable>
      {open.length === 0 ? (
        <Text variant="footnote" tone="secondary">
          Tudo em dia nesta lista.
        </Text>
      ) : (
        open.map((task) => (
          <View key={task.id} style={styles.row}>
            <Checkbox
              checked={false}
              label={task.title}
              onChange={(done) =>
                todo.setCompleted(task.id, done).catch((e: unknown) => console.error(e))
              }
            />
            <Text variant="body" style={styles.flex} numberOfLines={1}>
              {task.title}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing.lg + 6,
    marginBottom: spacing.md,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 3,
  },
  round: { borderRadius: radius.xl },
  shine: { position: 'absolute', top: 0, left: spacing.lg, right: spacing.lg, height: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, maxWidth: '100%' },
  body: { gap: spacing.md, marginTop: spacing.xs },
  group: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 40 },
  time: { width: 44 },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  connect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  lip: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
});
