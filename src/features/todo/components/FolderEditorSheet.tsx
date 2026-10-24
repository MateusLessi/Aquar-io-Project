import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  ConfirmDialog,
  Sheet,
  Switch,
  Text,
  TextInput,
  listColorNames,
  listColors,
  radius,
  spacing,
  useTheme,
  type ListColorName,
} from '@/design-system';

import type { FolderSummary } from '../domain/types';
import { ValidationError } from '../domain/validation';
import { useTodo } from '../hooks/todoContext';

const EMOJIS = ['🎓', '📘', '📗', '📙', '🏠', '💼', '🏋️', '✈️', '🎯', '💡', '❤️', '🌊'];

type FolderEditorSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Edit this folder; create a new one when omitted. */
  folder?: FolderSummary | null;
  /** New folders go inside this one. */
  parentId?: string | null;
  /** Name of where it is created, for the title ("Nova pasta em UnB"). */
  parentName?: string | null;
  onCreated?: (id: string) => void;
  onDeleted?: () => void;
};

export function FolderEditorSheet({
  visible,
  onClose,
  folder,
  parentName,
  ...rest
}: FolderEditorSheetProps) {
  const title = folder ? 'Editar pasta' : parentName ? `Nova pasta em ${parentName}` : 'Nova pasta';
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {visible ? <FolderForm folder={folder} onClose={onClose} {...rest} /> : null}
    </Sheet>
  );
}

function FolderForm({
  folder,
  parentId,
  onClose,
  onCreated,
  onDeleted,
}: Omit<FolderEditorSheetProps, 'visible' | 'parentName'>) {
  const todo = useTodo();
  const { colors, scheme } = useTheme();
  const [name, setName] = useState(folder?.name ?? '');
  const [emoji, setEmoji] = useState<string | null>(folder?.emoji ?? '📘');
  const [color, setColor] = useState<ListColorName | null>(folder?.color ?? 'tide');
  const [pinned, setPinned] = useState(folder?.pinned ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (folder) {
        await todo.updateFolder(folder.id, { name, emoji, color, pinned });
      } else {
        const id = await todo.createFolder({ name, emoji, color, parentId });
        if (pinned) await todo.updateFolder(id, { pinned });
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

  const remove = async (mode: 'keep' | 'all') => {
    if (!folder) return;
    setConfirmAll(false);
    await todo.deleteFolder(folder.id, mode);
    onClose();
    onDeleted?.();
  };

  const inside = folder ? folder.listCount + folder.folderCount : 0;

  return (
    <View style={styles.form}>
      <TextInput
        label="Nome"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="UnB, Semestre 3, Trabalho…"
        error={error ?? undefined}
        autoFocus={!folder}
        returnKeyType="done"
        onSubmitEditing={save}
        maxLength={60}
      />

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
          Emoji
        </Text>
        <View style={styles.wrap}>
          {EMOJIS.map((option) => {
            const selected = emoji === option;
            return (
              <Pressable
                key={option}
                onPress={() => setEmoji(selected ? null : option)}
                accessibilityRole="radio"
                accessibilityLabel={`Emoji ${option}`}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                style={[
                  styles.emoji,
                  { backgroundColor: selected ? colors.accentSoft : colors.surfacePressed },
                  selected && { borderColor: colors.accent, borderWidth: 2 },
                ]}
              >
                <Text variant="title2">{option}</Text>
              </Pressable>
            );
          })}
        </View>
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
                accessibilityRole="radio"
                accessibilityLabel={`Cor ${option}`}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
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

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="body">Mostrar no Início</Text>
          <Text variant="footnote" tone="secondary">
            A pasta aparece no painel com o progresso e as próximas tarefas.
          </Text>
        </View>
        <Switch value={pinned} onChange={setPinned} label="Mostrar no Início" />
      </View>

      <Button label={folder ? 'Salvar' : 'Criar pasta'} block loading={saving} onPress={save} />

      {folder && !deleting ? (
        <Button label="Apagar pasta" variant="danger" block onPress={() => setDeleting(true)} />
      ) : null}
      {folder && deleting ? (
        <View style={[styles.deleteBox, { borderColor: colors.border }]}>
          <Text variant="headline">Apagar “{folder.name}”?</Text>
          {inside > 0 ? (
            <>
              <Text variant="footnote" tone="secondary">
                Ela tem {folder.listCount} {folder.listCount === 1 ? 'lista' : 'listas'}
                {folder.folderCount > 0
                  ? ` e ${folder.folderCount} ${folder.folderCount === 1 ? 'pasta' : 'pastas'}`
                  : ''}{' '}
                dentro.
              </Text>
              <Button
                label="Apagar só a pasta, manter o conteúdo"
                variant="secondary"
                block
                onPress={() => void remove('keep')}
              />
              <Button
                label="Apagar tudo o que tem dentro"
                variant="danger"
                block
                onPress={() => setConfirmAll(true)}
              />
            </>
          ) : (
            <Button label="Apagar" variant="danger" block onPress={() => void remove('keep')} />
          )}
          <Button label="Cancelar" variant="ghost" block onPress={() => setDeleting(false)} />
        </View>
      ) : null}

      <ConfirmDialog
        visible={confirmAll}
        title="Apagar tudo?"
        message={`A pasta, ${folder?.listCount ?? 0} listas e todas as tarefas delas somem deste e dos seus outros aparelhos.`}
        confirmLabel="Apagar tudo"
        destructive
        onConfirm={() => void remove('all')}
        onCancel={() => setConfirmAll(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl },
  group: { gap: spacing.sm },
  groupLabel: { marginLeft: spacing.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emoji: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  deleteBox: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
