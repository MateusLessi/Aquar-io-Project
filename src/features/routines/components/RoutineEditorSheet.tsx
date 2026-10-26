import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { requestNotificationPermission } from '@/core/notifications';
import {
  Button,
  Chip,
  ConfirmDialog,
  SegmentedControl,
  Sheet,
  Text,
  TextInput,
  TimePicker,
  listColorNames,
  listColors,
  radius,
  spacing,
  useTheme,
  type ListColorName,
} from '@/design-system';

import { toMinutes } from '../domain/schedule';
import type { NewRoutine, Routine, RoutineItem } from '../domain/types';

const EMOJIS = ['🌅', '☕', '💼', '🏋️', '📚', '🧘', '🍽️', '🛏️', '🚗', '🧹', '🎮', '🌙'];
const EVERY_DAY = 0b1111111;
const WEEKDAYS = 0b0111110;
const DAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type RoutineEditorSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Edit this routine; create a new one when omitted. */
  routine?: (Routine & { items: RoutineItem[] }) | null;
  onSubmit: (input: NewRoutine) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Labels already used on other routines, offered as one-tap choices. */
  tagSuggestions?: string[];
};

export function RoutineEditorSheet({
  visible,
  onClose,
  routine,
  ...actions
}: RoutineEditorSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={routine ? 'Editar rotina' : 'Nova rotina'}>
      {/* Remount for each opening so the form starts from the routine's current values. */}
      {visible ? <RoutineForm routine={routine} onClose={onClose} {...actions} /> : null}
    </Sheet>
  );
}

function RoutineForm({
  routine,
  onClose,
  onSubmit,
  onDelete,
  tagSuggestions = [],
}: Omit<RoutineEditorSheetProps, 'visible'>) {
  const { colors, scheme } = useTheme();
  const [name, setName] = useState(routine?.name ?? '');
  const [emoji, setEmoji] = useState<string | null>(routine?.emoji ?? '🌅');
  const [color, setColor] = useState<ListColorName>(routine?.color ?? 'lagoon');
  const [start, setStart] = useState(routine?.start ?? '07:00');
  const [end, setEnd] = useState(routine?.end ?? '08:00');
  const [editingTime, setEditingTime] = useState<'start' | 'end' | null>(null);
  const [days, setDays] = useState(routine?.days ?? EVERY_DAY);
  const [remind, setRemind] = useState(routine?.remind ?? false);
  const [tag, setTag] = useState(routine?.tag ?? '');
  const [items, setItems] = useState<string[]>(routine?.items.map((i) => i.title) ?? []);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tone = listColors[color][scheme];
  const badTime = toMinutes(end) <= toMinutes(start);

  const addItem = () => {
    const title = draft.trim();
    if (!title) return;
    setItems((current) => [...current, title]);
    setDraft('');
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSubmit({ name, emoji, color, start, end, days, remind, tag, items });
      if (remind) await requestNotificationPermission();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar. Tente de novo.');
    } finally {
      setSaving(false);
    }
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
        placeholder="Manhã, Trabalho, Academia…"
        error={error ?? undefined}
        autoFocus={!routine}
        maxLength={60}
      />

      <Group label="Ícone e cor">
        <View style={styles.wrap}>
          {EMOJIS.map((option) => {
            const selected = emoji === option;
            return (
              <Pressable
                key={option}
                onPress={() => setEmoji(option)}
                accessibilityRole="radio"
                accessibilityLabel={`Ícone ${option}`}
                accessibilityState={{ checked: selected }}
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
        <View style={styles.wrap}>
          {listColorNames.map((name) => (
            <Pressable
              key={name}
              onPress={() => setColor(name)}
              accessibilityRole="radio"
              accessibilityLabel={`Cor ${name}`}
              accessibilityState={{ checked: color === name }}
              style={[
                styles.swatch,
                { backgroundColor: listColors[name][scheme] },
                color === name && { borderColor: colors.textPrimary, borderWidth: 3 },
              ]}
            />
          ))}
        </View>
      </Group>

      <Group label="Etiqueta (opcional)">
        <TextInput
          label="Etiqueta"
          value={tag}
          onChangeText={setTag}
          placeholder="Faculdade, Saúde, Trabalho…"
          maxLength={20}
        />
        {tagSuggestions.length > 0 ? (
          <View style={styles.wrap}>
            {tagSuggestions.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={tag.trim() === option}
                onPress={() => setTag(tag.trim() === option ? '' : option)}
              />
            ))}
          </View>
        ) : null}
      </Group>

      <Group label="Horário">
        <View style={styles.times}>
          {(['start', 'end'] as const).map((which) => (
            <Pressable
              key={which}
              onPress={() => setEditingTime(editingTime === which ? null : which)}
              accessibilityRole="button"
              accessibilityLabel={`${which === 'start' ? 'Começa' : 'Termina'} às ${which === 'start' ? start : end}`}
              style={[
                styles.timeButton,
                {
                  borderColor: editingTime === which ? tone : colors.border,
                  backgroundColor: colors.surfaceRaised,
                },
              ]}
            >
              <Text variant="caption" tone="secondary">
                {which === 'start' ? 'Começa' : 'Termina'}
              </Text>
              <Text variant="title2">{which === 'start' ? start : end}</Text>
            </Pressable>
          ))}
        </View>
        {editingTime ? (
          <TimePicker
            value={editingTime === 'start' ? start : end}
            onChange={editingTime === 'start' ? setStart : setEnd}
          />
        ) : null}
        {badTime ? (
          <Text variant="footnote" tone="error">
            O fim precisa ser depois do começo.
          </Text>
        ) : null}
      </Group>

      <Group label="Dias">
        <View style={styles.wrap}>
          <Chip label="Todo dia" selected={days === EVERY_DAY} onPress={() => setDays(EVERY_DAY)} />
          <Chip label="Dias úteis" selected={days === WEEKDAYS} onPress={() => setDays(WEEKDAYS)} />
        </View>
        <View style={styles.weekdays}>
          {DAY_LETTERS.map((letter, i) => {
            const on = (days & (1 << i)) !== 0;
            return (
              <Pressable
                key={i}
                onPress={() => setDays(days ^ (1 << i))}
                accessibilityRole="checkbox"
                accessibilityLabel={DAY_NAMES[i]}
                accessibilityState={{ checked: on }}
                style={[
                  styles.weekday,
                  { backgroundColor: on ? tone : 'transparent', borderColor: tone },
                ]}
              >
                <Text variant="headline" style={{ color: on ? colors.surfaceRaised : tone }}>
                  {letter}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Group>

      <Group label={`Itens${items.length ? ` · ${items.length}` : ''}`}>
        {items.map((item, index) => (
          <View
            key={`${item}-${index}`}
            style={[styles.itemRow, { borderColor: colors.separator }]}
          >
            <Text variant="body" style={styles.flex}>
              {index + 1}. {item}
            </Text>
            <Pressable
              onPress={() => setItems(items.filter((_, i) => i !== index))}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${item}`}
              hitSlop={10}
            >
              <X size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        ))}
        <TextInput
          label="Novo item"
          value={draft}
          onChangeText={setDraft}
          placeholder="Beber água, Alongar, Café…"
          returnKeyType="done"
          onSubmitEditing={addItem}
          submitBehavior="submit"
        />
        <Button
          label="Adicionar item"
          variant="secondary"
          disabled={!draft.trim()}
          onPress={addItem}
        />
      </Group>

      <Group label="Lembrete no início">
        <SegmentedControl
          accessibilityLabel="Lembrete no início"
          options={[
            { value: 'off', label: 'Não' },
            { value: 'on', label: 'Sim' },
          ]}
          value={remind ? 'on' : 'off'}
          onChange={(value) => setRemind(value === 'on')}
        />
      </Group>

      <Button
        label={routine ? 'Salvar' : 'Criar rotina'}
        block
        loading={saving}
        disabled={name.trim().length === 0 || days === 0 || badTime}
        onPress={save}
      />
      {routine && onDelete ? (
        <>
          <Button
            label="Apagar rotina"
            variant="danger"
            block
            onPress={() => setConfirmDelete(true)}
          />
          <ConfirmDialog
            visible={confirmDelete}
            title="Apagar esta rotina?"
            message="Ela some deste e dos seus outros aparelhos."
            confirmLabel="Apagar"
            destructive
            onConfirm={() => {
              setConfirmDelete(false);
              void onDelete().then(onClose);
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      ) : null}
    </View>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
        {label}
      </Text>
      {children}
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
  swatch: { width: 40, height: 40, borderRadius: 20 },
  times: { flexDirection: 'row', gap: spacing.md },
  timeButton: { flex: 1, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.xs,
  },
  flex: { flex: 1 },
});
