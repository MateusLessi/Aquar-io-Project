import { Check, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  ConfirmDialog,
  Sheet,
  Switch,
  radius,
  Text,
  TextInput,
  listColorNames,
  listColors,
  spacing,
  useTheme,
  type ListColorName,
  GlyphPicker,
  glyphKey,
  type GlyphKey,
} from '@/design-system';

import type { TaskList } from '../domain/types';
import { ValidationError } from '../domain/validation';
import { useTodo } from '../hooks/todoContext';

const GLYPHS: GlyphKey[] = [
  'dumbbell',
  'library',
  'laptop',
  'house',
  'cart',
  'target',
  'lightbulb',
  'heart',
  'waves',
  'plane',
  'music',
  'shell',
  'briefcase',
  'palette',
  'wallet',
  'utensils',
];

const colorNames: Record<ListColorName, string> = {
  lagoon: 'Laguna',
  tide: 'Maré',
  coral: 'Coral',
  kelp: 'Alga',
  sand: 'Areia',
  anemone: 'Anêmona',
};

type ListEditorSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Edit this list; create a new one when omitted. */
  list?: TaskList | null;
  onCreated?: (id: string) => void;
  onDeleted?: () => void;
  /** New lists go into this folder. */
  folderId?: string | null;
};

export function ListEditorSheet({
  visible,
  onClose,
  list,
  onCreated,
  onDeleted,
  folderId,
}: ListEditorSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={list ? 'Editar lista' : 'Nova lista'}>
      {/* Remount the form for each opening so it starts from the list's current values. */}
      {visible ? (
        <ListForm
          list={list}
          onClose={onClose}
          onCreated={onCreated}
          onDeleted={onDeleted}
          folderId={folderId}
        />
      ) : null}
    </Sheet>
  );
}

function ListForm({
  list,
  onClose,
  onCreated,
  onDeleted,
  folderId,
}: Omit<ListEditorSheetProps, 'visible'>) {
  const todo = useTodo();
  const { colors, scheme } = useTheme();
  const [name, setName] = useState(list?.name ?? '');
  const [emoji, setEmoji] = useState<string | null>(glyphKey(list?.emoji));
  const [color, setColor] = useState<ListColorName | null>(list?.color ?? 'lagoon');
  const [resets, setResets] = useState(list?.resets ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (list) {
        await todo.updateList(list.id, { name, emoji, color, resets });
      } else {
        const id = await todo.createList({ name, emoji, color, folderId, resets });
        onCreated?.(id);
      }
      onClose();
    } catch (e) {
      setError(
        e instanceof ValidationError ? e.message : 'Não foi possível salvar. Tente de novo.',
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!list) return;
    setConfirmDelete(false);
    await todo.deleteList(list.id);
    onClose();
    onDeleted?.();
  };

  return (
    <View style={styles.form}>
      <TextInput
        label="Nome"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="Academia, Faculdade, Casa…"
        error={error ?? undefined}
        autoFocus={!list}
        returnKeyType="done"
        onSubmitEditing={save}
      />

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
          Ícone
        </Text>
        <GlyphPicker options={GLYPHS} value={emoji} onChange={setEmoji} />
      </View>

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
          Cor
        </Text>
        <View style={styles.wrap}>
          {listColorNames.map((option) => {
            const selected = color === option;
            return (
              <Pressable
                key={option}
                onPress={() => setColor(option)}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${colorNames[option]}`}
                accessibilityState={{ selected }}
                aria-selected={selected}
                style={[
                  styles.swatch,
                  { backgroundColor: listColors[option][scheme] },
                  selected && { borderColor: colors.textPrimary, borderWidth: 3 },
                ]}
              >
                {selected ? <Check size={20} color={colors.surfaceRaised} strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.resets, { backgroundColor: colors.waterline }]}>
        <RotateCcw size={20} color={colors.accent} />
        <View style={styles.flex}>
          <Text variant="bodyStrong">Zera todo dia</Text>
          <Text variant="footnote" tone="secondary">
            Para treinos e checklists: os itens voltam desmarcados no dia seguinte.
          </Text>
        </View>
        <Switch value={resets} onChange={setResets} label="Zera todo dia" />
      </View>

      <Button label={list ? 'Salvar' : 'Criar lista'} block loading={saving} onPress={save} />
      {list ? (
        <Button
          label="Excluir lista"
          variant="danger"
          block
          onPress={() => setConfirmDelete(true)}
        />
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title={`Excluir "${list?.name ?? ''}"?`}
        message={
          list && list.pendingCount > 0
            ? `A lista e suas tarefas (${list.pendingCount} pendentes) serão excluídas.`
            : 'A lista e suas tarefas serão excluídas.'
        }
        confirmLabel="Excluir"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  resets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  flex: { flex: 1, gap: 2 },
  form: { gap: spacing.xl, paddingBottom: spacing.sm },
  group: { gap: spacing.sm },
  groupLabel: { marginLeft: spacing.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
