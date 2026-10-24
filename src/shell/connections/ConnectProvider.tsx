import { Check, Home } from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLinks } from '@/core/links/linksContext';
import {
  canLink,
  LinkError,
  type LinkItemKind,
  type LinkTargetKind,
} from '@/core/links/linksRepository';
import { Sheet, Text, haptics, radius, spacing, useTheme } from '@/design-system';
import { creatures } from '@/features/habits/domain/creatures';
import { MAX_FOLDER_DEPTH } from '@/features/todo/domain/validation';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { HabitTimeSheet, type HabitTimeRequest } from './HabitTimeSheet';
import { useConnections } from './useConnected';

/** Something that can be placed somewhere. */
export type ConnectItem = { kind: LinkItemKind; id: string; name: string };
/** Somewhere things can be placed: a habit, a routine, or (for lists and folders) a folder. */
export type ConnectTarget = { kind: LinkTargetKind | 'folder'; id: string | null; name: string };

/** "Conectar a…" from an item, or "Conectar algo a…" into a target. */
export type ConnectRequest = { from: ConnectItem } | { into: ConnectTarget };

type ConnectApi = {
  open: (request: ConnectRequest) => void;
  /** Places `item` in `target`; asks for a time first when a habit goes into a routine. */
  connect: (item: ConnectItem, target: ConnectTarget) => void;
  /** Whether `item` can go into `target` (used to light up drop targets). */
  accepts: (item: ConnectItem, target: ConnectTarget) => boolean;
};

const ConnectContext = createContext<ConnectApi | null>(null);

export function useConnect(): ConnectApi {
  const api = useContext(ConnectContext);
  if (!api) throw new Error('useConnect must be used inside ConnectProvider.');
  return api;
}

type Toast = { message: string; undo: (() => Promise<void>) | null };

/**
 * The connection system: the "Conectar a…" sheet, the time question for habits in routines,
 * and the confirmation with "Desfazer". Lists or folders dropped on a folder are moved into it
 * (todo's own move); everything else becomes a link (core/links).
 */
export function ConnectProvider({ children }: { children: React.ReactNode }) {
  const links = useLinks();
  const todo = useTodo();
  const connections = useConnections();
  const [request, setRequest] = useState<ConnectRequest | null>(null);
  const [timing, setTiming] = useState<
    (HabitTimeRequest & { item: ConnectItem; target: ConnectTarget }) | null
  >(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((next: Toast) => {
    clearTimeout(hide.current);
    setToast(next);
    hide.current = setTimeout(() => setToast(null), 5000);
  }, []);
  useEffect(() => () => clearTimeout(hide.current), []);

  const { folders, lists, routines } = connections;
  const folderById = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  const accepts = useCallback(
    (item: ConnectItem, target: ConnectTarget): boolean => {
      if (target.kind === 'folder') {
        if (item.kind === 'list') return true;
        if (item.kind !== 'folder' || item.id === target.id) return false;
        // A folder cannot go inside itself nor past the depth limit.
        let height = 1;
        const below = (id: string, level: number) => {
          height = Math.max(height, level);
          for (const f of folders) if (f.parentId === id) below(f.id, level + 1);
        };
        below(item.id, 1);
        for (let at = target.id; at; at = folderById.get(at)?.parentId ?? null) {
          if (at === item.id) return false;
        }
        const depth = target.id ? (folderById.get(target.id)?.depth ?? 0) : 0;
        return depth + height <= MAX_FOLDER_DEPTH;
      }
      return canLink(item.kind, target.kind);
    },
    [folderById, folders],
  );

  const place = useCallback(
    async (item: ConnectItem, target: ConnectTarget, at: string | null) => {
      try {
        if (target.kind === 'folder') {
          if (item.kind === 'list') {
            const before = lists.find((l) => l.id === item.id)?.folderId ?? null;
            await todo.moveList(item.id, target.id);
            show({
              message: `Pronto: ${item.name} agora está em ${target.name}`,
              undo: () => todo.moveList(item.id, before),
            });
          } else {
            const before = folderById.get(item.id)?.parentId ?? null;
            await todo.moveFolder(item.id, target.id);
            show({
              message: `Pronto: ${item.name} agora está em ${target.name}`,
              undo: () => todo.moveFolder(item.id, before),
            });
          }
        } else {
          const id = await links.link({
            itemKind: item.kind,
            itemId: item.id,
            targetKind: target.kind,
            targetId: target.id!,
            at,
          });
          show({
            message: `Pronto: ${item.name} agora está em ${target.name}`,
            undo: () => links.unlink(id),
          });
        }
        haptics.success();
      } catch (e) {
        show({
          message: e instanceof Error && e.name !== 'Error' ? e.message : 'Não deu para conectar.',
          undo: null,
        });
        if (!(e instanceof LinkError)) console.error(e);
      }
    },
    [folderById, links, lists, show, todo],
  );

  const connect = useCallback(
    (item: ConnectItem, target: ConnectTarget) => {
      setRequest(null);
      if (!accepts(item, target)) {
        show({ message: 'Isso não encaixa aqui.', undo: null });
        return;
      }
      const routine =
        item.kind === 'habit' && target.kind === 'routine'
          ? routines.find((r) => r.id === target.id)
          : undefined;
      if (routine) {
        setTiming({
          item,
          target,
          habitName: item.name,
          routineName: routine.name,
          start: routine.start,
          end: routine.end,
          at: null,
        });
        return;
      }
      void place(item, target, null);
    },
    [accepts, place, routines, show],
  );

  const api = useMemo<ConnectApi>(
    () => ({ open: setRequest, connect, accepts }),
    [connect, accepts],
  );

  return (
    <ConnectContext.Provider value={api}>
      {children}
      <ConnectSheet request={request} onClose={() => setRequest(null)} />
      <HabitTimeSheet
        request={timing}
        onClose={() => setTiming(null)}
        onConfirm={(at) => {
          if (timing) void place(timing.item, timing.target, at);
          setTiming(null);
        }}
      />
      {toast ? (
        <ConnectToast
          toast={toast}
          onUndo={() => {
            const undo = toast.undo;
            setToast(null);
            undo?.().catch((e: unknown) => console.error(e));
          }}
        />
      ) : null}
    </ConnectContext.Provider>
  );
}

function ConnectToast({ toast, onUndo }: { toast: Toast; onUndo: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      pointerEvents="box-none"
      style={[styles.toastWrap, { top: insets.top + spacing.sm }]}
    >
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text variant="callout" style={styles.flex} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.undo ? (
          <Pressable onPress={onUndo} accessibilityRole="button" hitSlop={10}>
            <Text variant="callout" tone="accent" style={styles.bold}>
              Desfazer
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

type Option = {
  key: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  onPress?: () => void;
  done?: boolean;
};

/** The menu version of connecting: every place an item fits, or everything a target takes. */
function ConnectSheet({
  request,
  onClose,
}: {
  request: ConnectRequest | null;
  onClose: () => void;
}) {
  const { connect, accepts } = useConnect();
  const { colors } = useTheme();
  const { habits, lists, folders, routines, inside, placesOf } = useConnections();

  const sections: { title: string; options: Option[] }[] = [];
  let title = '';
  if (request && 'from' in request) {
    const item = request.from;
    title = `Conectar “${item.name}” a…`;
    const already = new Set(
      placesOf(item.kind, item.id).map((p) => `${p.kind}:${p.link.targetId}`),
    );
    const routineTargets: Option[] = routines.map((r) => {
      const target: ConnectTarget = { kind: 'routine', id: r.id, name: r.name };
      const done = already.has(`routine:${r.id}`);
      return {
        key: `routine:${r.id}`,
        label: `${r.emoji ?? '⏱️'} ${r.name}`,
        hint: `${r.start}–${r.end}`,
        icon: null,
        done,
        onPress: done ? undefined : () => connect(item, target),
      };
    });
    if (routineTargets.length) sections.push({ title: 'Rotinas', options: routineTargets });
    if (item.kind !== 'habit') {
      sections.push({
        title: 'Hábitos',
        options: habits.map((h) => {
          const done = already.has(`habit:${h.id}`);
          return {
            key: `habit:${h.id}`,
            label: `${creatures[h.creature].emoji} ${h.name}`,
            hint: 'Hábito',
            icon: null,
            done,
            onPress: done
              ? undefined
              : () => connect(item, { kind: 'habit', id: h.id, name: h.name }),
          };
        }),
      });
      const top: ConnectTarget = { kind: 'folder', id: null, name: 'Listas (início)' };
      // Where it is now: marked, not offered.
      const currentFolder =
        item.kind === 'list'
          ? (lists.find((l) => l.id === item.id)?.folderId ?? null)
          : (folders.find((f) => f.id === item.id)?.parentId ?? null);
      sections.push({
        title: 'Guardar em pasta',
        options: [
          {
            key: 'folder:top',
            label: 'Listas (início)',
            hint: 'Sem pasta',
            icon: <Home size={18} color={colors.textSecondary} />,
            done: currentFolder === null,
            onPress:
              currentFolder !== null && accepts(item, top) ? () => connect(item, top) : undefined,
          },
          ...folders.map((f) => {
            const target: ConnectTarget = { kind: 'folder', id: f.id, name: f.name };
            const here = currentFolder === f.id;
            return {
              key: `folder:${f.id}`,
              label: `${'  '.repeat(f.depth - 1)}${f.emoji ?? '📁'} ${f.name}`,
              hint: 'Pasta',
              icon: null,
              done: here,
              onPress: !here && accepts(item, target) ? () => connect(item, target) : undefined,
            };
          }),
        ],
      });
    }
  } else if (request && 'into' in request && request.into.kind !== 'folder') {
    const target = request.into;
    title = `Conectar algo a “${target.name}”`;
    const present = new Set(
      inside(target.kind as LinkTargetKind, target.id!).map((c) => `${c.kind}:${c.link.itemId}`),
    );
    const option = (item: ConnectItem, label: string, hint: string): Option => {
      const done = present.has(`${item.kind}:${item.id}`);
      return {
        key: `${item.kind}:${item.id}`,
        label,
        hint,
        icon: null,
        done,
        onPress: done ? undefined : () => connect(item, target),
      };
    };
    if (target.kind === 'routine') {
      sections.push({
        title: 'Hábitos',
        options: habits.map((h) =>
          option(
            { kind: 'habit', id: h.id, name: h.name },
            `${creatures[h.creature].emoji} ${h.name}`,
            'Entra com horário',
          ),
        ),
      });
    }
    sections.push({
      title: 'Listas',
      options: lists.map((l) =>
        option(
          { kind: 'list', id: l.id, name: l.name },
          `${l.emoji ?? '📋'} ${l.name}`,
          `${l.pendingCount} pendentes`,
        ),
      ),
    });
    sections.push({
      title: 'Pastas',
      options: folders.map((f) =>
        option(
          { kind: 'folder', id: f.id, name: f.name },
          `${f.emoji ?? '📁'} ${f.name}`,
          `${f.openCount} pendentes`,
        ),
      ),
    });
  }

  return (
    <Sheet visible={request !== null} onClose={onClose} title={title}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.sections}>
        {sections
          .filter((s) => s.options.length > 0)
          .map((section) => (
            <View key={section.title} style={styles.section}>
              <Text variant="overline" tone="tertiary">
                {section.title}
              </Text>
              {section.options.map((o) => (
                <Pressable
                  key={o.key}
                  onPress={o.onPress}
                  disabled={!o.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={`${o.label.trim()}, ${o.done ? 'já conectado' : o.hint}`}
                  accessibilityState={{ disabled: !o.onPress }}
                  style={({ pressed }) => [
                    styles.option,
                    { opacity: o.onPress || o.done ? 1 : 0.4 },
                    pressed && { backgroundColor: colors.surfacePressed },
                  ]}
                >
                  {o.icon}
                  <Text variant="body" style={styles.flex} numberOfLines={1}>
                    {o.label}
                  </Text>
                  {o.done ? (
                    <Check size={18} color={colors.accent} />
                  ) : (
                    <Text variant="footnote" tone="tertiary">
                      {o.hint}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  scroll: { maxHeight: 520 },
  sections: { gap: spacing.lg, paddingBottom: spacing.md },
  section: { gap: 2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  toastWrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
});
