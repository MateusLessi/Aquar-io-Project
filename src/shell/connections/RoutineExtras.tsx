import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLinks } from '@/core/links/linksContext';
import { ConfirmDialog, Text, spacing, useTheme, withAlpha } from '@/design-system';
import { creatures } from '@/features/habits/domain/creatures';
import { useHabitActions } from '@/features/habits/hooks/useHabitActions';
import type { RoutineToday } from '@/features/routines/domain/types';

import { HabitInPiece, ListInPiece } from './RoutinePiece';
import { useConnections } from './useConnected';

/**
 * What a routine holds, on the dashboard's timeline: the routine happening now shows its
 * habits (with their controls) and lists; the others, a line of badges.
 */
export function RoutineExtras({ routine }: { routine: RoutineToday }) {
  const router = useRouter();
  const links = useLinks();
  const { colors } = useTheme();
  const { inside, todayKey } = useConnections();
  const actions = useHabitActions(todayKey);
  const [unlinking, setUnlinking] = useState<{ id: string; name: string } | null>(null);
  const items = inside('routine', routine.id);
  if (items.length === 0) return null;

  if (routine.phase !== 'now') {
    const names = items.map((c) =>
      c.kind === 'habit'
        ? `${creatures[c.habit.creature].emoji} ${c.habit.name}`
        : c.kind === 'list'
          ? `📋 ${c.list.name}`
          : `📁 ${c.folder.name}`,
    );
    return (
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {names.join(' · ')}
      </Text>
    );
  }

  return (
    <View style={[styles.root, { borderTopColor: withAlpha(colors.textPrimary, 0.1) }]}>
      {items.map((c) =>
        c.kind === 'habit' ? (
          <HabitInPiece
            key={c.link.id}
            habit={c.habit}
            at={c.link.at}
            actions={actions}
            onTime={() => router.navigate({ pathname: '/aquarium', params: { tab: 'routines' } })}
            onUnlink={() => setUnlinking({ id: c.link.id, name: c.habit.name })}
          />
        ) : c.kind === 'list' ? (
          <ListInPiece
            key={c.link.id}
            list={c.list}
            onOpen={() =>
              router.push({ pathname: '/aquarium/lists/[id]', params: { id: c.list.id } })
            }
            onUnlink={() => setUnlinking({ id: c.link.id, name: c.list.name })}
          />
        ) : null,
      )}
      <ConfirmDialog
        visible={unlinking !== null}
        title={`Tirar “${unlinking?.name ?? ''}” desta rotina?`}
        message="Só desliga: nada é apagado."
        confirmLabel="Tirar"
        onConfirm={() => {
          if (unlinking) links.unlink(unlinking.id).catch((e: unknown) => console.error(e));
          setUnlinking(null);
        }}
        onCancel={() => setUnlinking(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1 },
});
