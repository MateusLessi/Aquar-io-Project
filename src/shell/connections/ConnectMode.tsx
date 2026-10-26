import { X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  IconButton,
  SegmentedControl,
  Text,
  haptics,
  listColors,
  radius,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';
import { creatures } from '@/features/habits/domain/creatures';

import type { ConnectItem, ConnectTarget } from './ConnectProvider';
import { DraggableChip } from './DraggableChip';
import { useConnections } from './useConnected';

type Tray = 'lists' | 'folders' | 'habits';
type Rect = { key: string; x: number; y: number; width: number; height: number };
type TargetEntry = {
  key: string;
  target: ConnectTarget;
  label: string;
  hint: string;
  tone: string;
};

/** What a target view offers to find where it is on screen. */
type Measurable = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

/**
 * "Modo Conectar": targets on top (routines, habits, folders), a tray of items at the bottom.
 * Hold an item and drag it onto a target, or tap an item and then tap a target. Targets that
 * do not take the item are dimmed; the one under the finger lights up.
 */
export function ConnectMode({
  visible,
  onClose,
  accepts,
  onDrop,
  overlays,
}: {
  visible: boolean;
  onClose: () => void;
  accepts: (item: ConnectItem, target: ConnectTarget) => boolean;
  onDrop: (item: ConnectItem, target: ConnectTarget) => void;
  /** The time question and the "Desfazer" toast, drawn above the mode. */
  overlays: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const { habits, lists, folders, routines } = useConnections();
  const [tray, setTray] = useState<Tray>('lists');
  const [held, setHeld] = useState<ConnectItem | null>(null);
  const [selected, setSelected] = useState<ConnectItem | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const targetViews = useRef(new Map<string, Measurable>());
  const rects = useRef<Rect[]>([]);

  const active = held ?? selected;
  const targets: { title: string; entries: TargetEntry[] }[] = [
    {
      title: 'Rotinas',
      entries: routines.map((r) => ({
        key: `routine:${r.id}`,
        target: { kind: 'routine', id: r.id, name: r.name },
        label: `${r.emoji ?? '⏱️'} ${r.name}`,
        hint: `${r.start}–${r.end}`,
        tone: listColors[r.color][scheme],
      })),
    },
    {
      title: 'Hábitos',
      entries: habits.map((h) => ({
        key: `habit:${h.id}`,
        target: { kind: 'habit', id: h.id, name: h.name },
        label: `${creatures[h.creature].emoji} ${h.name}`,
        hint: 'Hábito',
        tone: listColors[creatures[h.creature].color][scheme],
      })),
    },
    {
      title: 'Pastas',
      entries: [
        {
          key: 'folder:top',
          target: { kind: 'folder', id: null, name: 'Listas (início)' },
          label: '🏠 Listas (início)',
          hint: 'Sem pasta',
          tone: colors.accent,
        },
        ...folders.map((f) => ({
          key: `folder:${f.id}`,
          target: { kind: 'folder', id: f.id, name: f.name } as ConnectTarget,
          label: `${f.emoji ?? '📁'} ${f.name}`,
          hint: f.depth > 1 ? `Nível ${f.depth}` : 'Pasta',
          tone: f.color ? listColors[f.color][scheme] : colors.accent,
        })),
      ],
    },
  ];

  const items: ConnectItem[] =
    tray === 'lists'
      ? lists.map((l) => ({ kind: 'list', id: l.id, name: l.name }))
      : tray === 'folders'
        ? folders.map((f) => ({ kind: 'folder', id: f.id, name: f.name }))
        : habits.map((h) => ({ kind: 'habit', id: h.id, name: h.name }));
  const itemLabel = (item: ConnectItem) => {
    if (item.kind === 'list')
      return `${lists.find((l) => l.id === item.id)?.emoji ?? '📋'} ${item.name}`;
    if (item.kind === 'folder')
      return `${folders.find((f) => f.id === item.id)?.emoji ?? '📁'} ${item.name}`;
    const habit = habits.find((h) => h.id === item.id);
    return `${habit ? creatures[habit.creature].emoji : '🐠'} ${item.name}`;
  };

  /** Where every target is on screen, measured when a drag starts. */
  const measure = () => {
    const next: Rect[] = [];
    for (const [key, view] of targetViews.current) {
      view.measureInWindow((x, y, width, height) => next.push({ key, x, y, width, height }));
    }
    rects.current = next;
  };
  const hit = (x: number, y: number) =>
    rects.current.find((r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height)
      ?.key ?? null;
  const entryByKey = (key: string | null) =>
    targets.flatMap((s) => s.entries).find((e) => e.key === key);

  const drop = (item: ConnectItem, key: string | null) => {
    const entry = entryByKey(key);
    if (entry && accepts(item, entry.target)) onDrop(item, entry.target);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.surfaceBase }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.flex}>
            <Text variant="title1">Conectar</Text>
            <Text variant="footnote" tone="secondary">
              {active
                ? `Solte “${active.name}” onde ele deve ficar`
                : 'Segure um item da bandeja e arraste, ou toque nele e depois no destino.'}
            </Text>
          </View>
          <IconButton icon={X} label="Fechar o modo Conectar" onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.targets} scrollEnabled={!held}>
          {targets
            .filter((s) => s.entries.length > 0)
            .map((section) => (
              <View key={section.title} style={styles.section}>
                <Text variant="overline" tone="tertiary">
                  {section.title}
                </Text>
                <View style={styles.grid}>
                  {section.entries.map((entry) => {
                    const fits = active ? accepts(active, entry.target) : true;
                    const lit = hover === entry.key && fits;
                    return (
                      <Pressable
                        key={entry.key}
                        ref={(view) => {
                          if (view)
                            targetViews.current.set(entry.key, view as unknown as Measurable);
                          else targetViews.current.delete(entry.key);
                        }}
                        onPress={() => {
                          if (!selected) return;
                          if (fits) onDrop(selected, entry.target);
                          setSelected(null);
                        }}
                        disabled={!selected || !fits}
                        accessibilityRole="button"
                        accessibilityLabel={`${entry.label}, ${entry.hint}${
                          selected
                            ? fits
                              ? `. Colocar ${selected.name} aqui`
                              : '. Não encaixa'
                            : ''
                        }`}
                        style={[
                          styles.target,
                          {
                            borderColor: lit
                              ? colors.accent
                              : withAlpha(entry.tone, active && fits ? 0.6 : 0.3),
                            backgroundColor: lit ? colors.accentSoft : withAlpha(entry.tone, 0.08),
                            opacity: active && !fits ? 0.3 : 1,
                            borderStyle: active && fits && !lit ? 'dashed' : 'solid',
                          },
                          lit && {
                            shadowColor: colors.accent,
                            shadowOpacity: 0.5,
                            shadowRadius: 14,
                          },
                        ]}
                      >
                        <Text variant="headline" numberOfLines={1}>
                          {entry.label}
                        </Text>
                        <Text
                          variant="caption"
                          tone={lit ? 'accent' : 'secondary'}
                          numberOfLines={1}
                        >
                          {lit ? 'Soltar para conectar' : entry.hint}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
        </ScrollView>

        <View
          style={[
            styles.tray,
            {
              paddingBottom: insets.bottom + spacing.lg,
              backgroundColor: colors.surfaceRaised,
              borderTopColor: colors.border,
            },
          ]}
        >
          <SegmentedControl
            accessibilityLabel="Bandeja"
            options={[
              { value: 'lists', label: 'Listas' },
              { value: 'folders', label: 'Pastas' },
              { value: 'habits', label: 'Hábitos' },
            ]}
            value={tray}
            onChange={(value) => {
              setTray(value as Tray);
              setSelected(null);
            }}
          />
          <View style={styles.chips}>
            {items.length === 0 ? (
              <Text variant="footnote" tone="secondary">
                Nada aqui ainda.
              </Text>
            ) : (
              items.map((item) => (
                <DraggableChip
                  key={`${item.kind}:${item.id}`}
                  label={itemLabel(item)}
                  selected={selected?.id === item.id}
                  lifted={held?.id === item.id}
                  onSelect={() => setSelected(selected?.id === item.id ? null : item)}
                  onLift={() => {
                    haptics.selection();
                    measure();
                    setSelected(null);
                    setHeld(item);
                  }}
                  onMove={(x, y) => {
                    const key = hit(x, y);
                    if (key !== hover) setHover(key);
                  }}
                  onRelease={(x, y) => {
                    drop(item, hit(x, y));
                    setHeld(null);
                    setHover(null);
                  }}
                />
              ))
            )}
          </View>
        </View>
        {overlays}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // While dragging on the web, the browser must not start selecting text.
  root: { flex: 1, userSelect: 'none' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  targets: { padding: spacing.lg, paddingTop: 0, gap: spacing.lg, paddingBottom: 280 },
  section: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  target: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 64,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: 2,
  },
  tray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
