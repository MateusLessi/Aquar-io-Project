import { useRouter } from 'expo-router';
import { ChevronRight, Link2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useLinks } from '@/core/links/linksContext';
import type { LinkItemKind } from '@/core/links/linksRepository';
import {
  ConfirmDialog,
  Surface,
  Text,
  radius,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';
import { creatures } from '@/features/habits/domain/creatures';

import { useConnect } from './ConnectProvider';
import { useConnections } from './useConnected';

type Row = {
  key: string;
  linkId: string;
  icon: string;
  title: string;
  hint: string;
  open: () => void;
};

/**
 * "Conectado a": every link of a habit or list, in both directions (what it holds, where it
 * is). Holding a row takes the link off; nothing is deleted.
 */
export function ConnectedSection({
  kind,
  id,
  name,
}: {
  kind: LinkItemKind;
  id: string;
  name: string;
}) {
  const router = useRouter();
  const links = useLinks();
  const { open } = useConnect();
  const { colors } = useTheme();
  const { inside, placesOf } = useConnections();
  const [unlinking, setUnlinking] = useState<Row | null>(null);

  const rows: Row[] = [];
  for (const place of placesOf(kind, id)) {
    if (place.kind === 'routine') {
      rows.push({
        key: place.link.id,
        linkId: place.link.id,
        icon: place.routine.emoji ?? '⏱️',
        title: `Rotina ${place.routine.name}`,
        hint: `${place.routine.start}–${place.routine.end}${place.link.at ? ` · às ${place.link.at}` : ''}`,
        open: () => router.navigate({ pathname: '/aquarium', params: { tab: 'routines' } }),
      });
    } else {
      rows.push({
        key: place.link.id,
        linkId: place.link.id,
        icon: creatures[place.habit.creature].emoji,
        title: place.habit.name,
        hint: 'Hábito',
        open: () =>
          router.push({ pathname: '/aquarium/habits/[id]', params: { id: place.habit.id } }),
      });
    }
  }
  if (kind === 'habit') {
    for (const c of inside('habit', id)) {
      if (c.kind === 'list') {
        rows.push({
          key: c.link.id,
          linkId: c.link.id,
          icon: c.list.emoji ?? '📋',
          title: c.list.name,
          hint: `Lista · ${c.list.pendingCount} pendentes`,
          open: () => router.push({ pathname: '/aquarium/lists/[id]', params: { id: c.list.id } }),
        });
      } else if (c.kind === 'folder') {
        rows.push({
          key: c.link.id,
          linkId: c.link.id,
          icon: c.folder.emoji ?? '📁',
          title: c.folder.name,
          hint: `Pasta · ${c.folder.openCount} pendentes`,
          open: () =>
            router.push({ pathname: '/aquarium/folders/[id]', params: { id: c.folder.id } }),
        });
      }
    }
  }

  return (
    <Surface style={styles.card}>
      <Text variant="headline">{kind === 'list' ? 'Usada em' : 'Conectado a'}</Text>
      {rows.length === 0 ? (
        <Text variant="footnote" tone="secondary">
          {kind === 'habit'
            ? 'Coloque este hábito numa rotina ou ligue listas a ele.'
            : 'Coloque esta lista numa rotina ou num hábito.'}
        </Text>
      ) : (
        rows.map((row, index) => (
          <Pressable
            key={row.key}
            onPress={row.open}
            onLongPress={() => setUnlinking(row)}
            accessibilityRole="button"
            accessibilityLabel={`${row.title}, ${row.hint}. Abrir`}
            accessibilityActions={[{ name: 'longpress', label: 'Desconectar' }]}
            onAccessibilityAction={() => setUnlinking(row)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.separator,
              },
              pressed && { backgroundColor: colors.surfacePressed },
            ]}
          >
            <Text variant="title2">{row.icon}</Text>
            <View style={styles.flex}>
              <Text variant="body" numberOfLines={1}>
                {row.title}
              </Text>
              <Text variant="footnote" tone="secondary" numberOfLines={1}>
                {row.hint}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </Pressable>
        ))
      )}
      <Pressable
        onPress={() => open({ from: { kind, id, name } })}
        accessibilityRole="button"
        accessibilityLabel={`Conectar ${name} a…`}
        style={({ pressed }) => [
          styles.connect,
          { borderColor: withAlpha(colors.accent, 0.45) },
          pressed && { backgroundColor: colors.accentSoft },
        ]}
      >
        <Link2 size={16} color={colors.accent} />
        <Text variant="callout" tone="accent" style={styles.bold}>
          Conectar a…
        </Text>
      </Pressable>
      {kind === 'habit' ? (
        <Pressable
          onPress={() => open({ into: { kind: 'habit', id, name } })}
          accessibilityRole="button"
          accessibilityLabel={`Ligar uma lista ou pasta a ${name}`}
          style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }]}
        >
          <Text variant="footnote" tone="accent">
            Ligar uma lista ou pasta a este hábito
          </Text>
        </Pressable>
      ) : null}
      <ConfirmDialog
        visible={unlinking !== null}
        title={`Desconectar “${unlinking?.title ?? ''}”?`}
        message="Só desliga: nada é apagado."
        confirmLabel="Desconectar"
        onConfirm={() => {
          if (unlinking) links.unlink(unlinking.linkId).catch((e: unknown) => console.error(e));
          setUnlinking(null);
        }}
        onCancel={() => setUnlinking(null)}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.xs },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  connect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: spacing.xs,
  },
  secondary: { alignItems: 'center', paddingVertical: spacing.xs },
});
