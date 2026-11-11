import { Moon, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { weekdayOrder } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import {
  Button,
  Chip,
  SegmentedControl,
  Switch,
  Text,
  TextInput,
  glyphKey,
  glyphs,
  radius,
  spacing,
  useTheme,
} from '@/design-system';
import type { SourceDraft } from '@/features/habits/hooks/habitSources';
import { useRoutinesToday } from '@/features/routines/hooks/queries';
import type { TaskList } from '@/features/todo/domain/types';
import { useFolders, useLists } from '@/features/todo/hooks/queries';
import { useTodo } from '@/features/todo/hooks/todoContext';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** The weekdays with a list, as the habit's days. */
export const maskOf = (lists: SourceDraft['lists']) =>
  Object.entries(lists).reduce((mask, [day, id]) => (id ? mask | (1 << Number(day)) : mask), 0);

const iconOf = (value: string | null) => (value ? glyphs[glyphKey(value) ?? 'list'] : undefined);

/**
 * The habit editor's chooser for where a habit is done from: which list, folder or routine,
 * for a folder which list counts each day (or what is due), and when the day is done.
 * Creating a list or folder here creates it right away, ready to fill.
 */
export function SourcePicker({
  value,
  onChange,
}: {
  value: SourceDraft;
  onChange: (draft: SourceDraft) => void;
}) {
  const todo = useTodo();
  const { colors } = useTheme();
  const { weekStart } = useCalendarPrefs();
  const { data: lists = [] } = useLists();
  const { data: folders = [] } = useFolders();
  const { data: routines = [] } = useRoutinesToday();
  const [naming, setNaming] = useState<null | 'list' | 'folder' | number>(null);
  const [name, setName] = useState('');
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const set = (patch: Partial<SourceDraft>) => onChange({ ...value, ...patch });
  const report = (error: unknown) => console.warn('Could not create it.', error);

  const create = async () => {
    const text = name.trim();
    if (!text) return;
    if (naming === 'folder') {
      const id = await todo.createFolder({ name: text });
      set({ id, lists: {}, days: value.folderMode === 'weekday' ? 0 : null });
    } else if (naming === 'list') {
      // A habit's list starts over every day, like a checklist.
      const id = await todo.createList({ name: text, resets: true });
      set({ id });
    } else if (typeof naming === 'number' && value.id) {
      const id = await todo.createList({ name: text, folderId: value.id, resets: true });
      const next = { ...value.lists, [naming]: id };
      set({ lists: next, days: maskOf(next) });
      setEditingDay(null);
    }
    setName('');
    setNaming(null);
  };

  const nameField = (placeholder: string) => (
    <View style={styles.naming}>
      <View style={styles.flex}>
        <TextInput
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder={placeholder}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => void create().catch(report)}
        />
      </View>
      <Button label="Criar" onPress={() => void create().catch(report)} disabled={!name.trim()} />
    </View>
  );

  const doneWhen = (
    <View style={styles.block}>
      <Text variant="footnote" tone="secondary">
        Feito quando
      </Text>
      <SegmentedControl
        accessibilityLabel="Feito quando"
        options={[
          { value: 'all', label: 'Todos os itens' },
          { value: 'some', label: 'Pelo menos…' },
        ]}
        value={value.atLeast ? 'some' : 'all'}
        onChange={(mode) => set({ atLeast: mode === 'some' ? (value.atLeast ?? 3) : null })}
      />
      {value.atLeast ? (
        <View style={styles.row}>
          <Button
            label="−"
            variant="secondary"
            onPress={() => set({ atLeast: Math.max(1, (value.atLeast ?? 1) - 1) })}
          />
          <Text variant="title2" style={styles.count}>
            {value.atLeast} {value.atLeast === 1 ? 'item' : 'itens'}
          </Text>
          <Button
            label="+"
            variant="secondary"
            onPress={() => set({ atLeast: Math.min(99, (value.atLeast ?? 1) + 1) })}
          />
        </View>
      ) : null}
    </View>
  );

  if (value.kind === 'routine') {
    return (
      <View style={styles.root}>
        <Text variant="footnote" tone="secondary">
          Qual rotina?
        </Text>
        {routines.length === 0 ? (
          <Text variant="footnote" tone="tertiary">
            Crie uma rotina primeiro, em Agenda.
          </Text>
        ) : (
          <View style={styles.wrap}>
            {routines.map((r) => (
              <Chip
                key={r.id}
                label={r.name}
                icon={iconOf(r.emoji)}
                selected={value.id === r.id}
                onPress={() => set({ id: r.id, days: r.days })}
              />
            ))}
          </View>
        )}
        {doneWhen}
      </View>
    );
  }

  if (value.kind === 'list') {
    const chosen = lists.find((l) => l.id === value.id);
    return (
      <View style={styles.root}>
        <Text variant="footnote" tone="secondary">
          Qual lista?
        </Text>
        <View style={styles.wrap}>
          {lists.map((l) => (
            <Chip
              key={l.id}
              label={l.name}
              icon={iconOf(l.emoji)}
              selected={value.id === l.id}
              onPress={() => set({ id: l.id })}
            />
          ))}
          <Chip label="Nova lista" icon={Plus} onPress={() => setNaming('list')} />
        </View>
        {naming === 'list' ? nameField('Treino, Manhã, Leitura…') : null}
        {chosen ? <ResetsRow list={chosen} /> : null}
        {doneWhen}
      </View>
    );
  }

  // A folder.
  const inside = lists.filter((l) => l.folderId === value.id);
  const order = weekdayOrder(weekStart);
  return (
    <View style={styles.root}>
      <Text variant="footnote" tone="secondary">
        Qual pasta?
      </Text>
      <View style={styles.wrap}>
        {folders.map((f) => (
          <Chip
            key={f.id}
            label={f.name}
            icon={iconOf(f.emoji)}
            selected={value.id === f.id}
            onPress={() =>
              set({ id: f.id, lists: {}, days: value.folderMode === 'weekday' ? 0 : null })
            }
          />
        ))}
        <Chip label="Nova pasta" icon={Plus} onPress={() => setNaming('folder')} />
      </View>
      {naming === 'folder' ? nameField('Academia, Semestre 4…') : null}

      {value.id ? (
        <>
          <SegmentedControl
            accessibilityLabel="Como a pasta conta"
            options={[
              { value: 'weekday', label: 'Uma lista por dia' },
              { value: 'due', label: 'O que vence no dia' },
            ]}
            value={value.folderMode}
            onChange={(folderMode) =>
              set({ folderMode, days: folderMode === 'weekday' ? maskOf(value.lists) : null })
            }
          />
          {value.folderMode === 'due' ? (
            <Text variant="footnote" tone="secondary">
              Cada dia, as tarefas com prazo naquele dia, em qualquer lista da pasta.
            </Text>
          ) : (
            <View style={[styles.days, { backgroundColor: colors.waterline }]}>
              {order.map((day) => {
                const list = inside.find((l) => l.id === value.lists[day]);
                return (
                  <View key={day} style={styles.day}>
                    <View style={styles.row}>
                      <Text variant="bodyStrong" style={styles.dayName}>
                        {DAY_NAMES[day]}
                      </Text>
                      <Chip
                        label={list?.name ?? 'Descanso'}
                        icon={list ? iconOf(list.emoji) : Moon}
                        selected={Boolean(list)}
                        onPress={() => setEditingDay(editingDay === day ? null : day)}
                        accessibilityHint="Escolher a lista deste dia"
                      />
                    </View>
                    {editingDay === day ? (
                      <View style={[styles.wrap, styles.choices]}>
                        <Chip
                          label="Descanso"
                          icon={Moon}
                          selected={!list}
                          onPress={() => {
                            const next = { ...value.lists };
                            delete next[day];
                            set({ lists: next, days: maskOf(next) });
                            setEditingDay(null);
                          }}
                        />
                        {inside.map((l) => (
                          <Chip
                            key={l.id}
                            label={l.name}
                            icon={iconOf(l.emoji)}
                            selected={l.id === list?.id}
                            onPress={() => {
                              const next = { ...value.lists, [day]: l.id };
                              set({ lists: next, days: maskOf(next) });
                              setEditingDay(null);
                            }}
                          />
                        ))}
                        <Chip label="Nova lista" icon={Plus} onPress={() => setNaming(day)} />
                      </View>
                    ) : null}
                    {naming === day ? nameField('Legday, Push, Pull…') : null}
                  </View>
                );
              })}
            </View>
          )}
        </>
      ) : null}
      {doneWhen}
    </View>
  );
}

/** A habit's list usually starts over every day; say so, and let it be switched here. */
function ResetsRow({ list }: { list: TaskList }) {
  const todo = useTodo();
  const { colors } = useTheme();
  return (
    <View style={[styles.resets, { backgroundColor: colors.waterline }]}>
      <View style={styles.flex}>
        <Text variant="bodyStrong">Zera todo dia</Text>
        <Text variant="footnote" tone="secondary">
          {list.resets
            ? 'Todos os itens contam todo dia.'
            : 'Desligado: contam só as tarefas com prazo no dia.'}
        </Text>
      </View>
      <Switch
        value={list.resets}
        onChange={(resets) =>
          void todo
            .updateList(list.id, { resets })
            .catch((e: unknown) => console.warn('Could not change the list.', e))
        }
        label="Zera todo dia"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md, marginTop: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  naming: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  block: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  count: { minWidth: 96, textAlign: 'center' },
  days: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  day: { gap: spacing.sm },
  dayName: { width: 40 },
  choices: { paddingLeft: 52 },
  resets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
});
