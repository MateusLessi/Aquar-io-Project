import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Chip,
  ConfirmDialog,
  Sheet,
  Text,
  TextInput,
  listColors,
  radius,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';

import { requestNotificationPermission } from '@/core/notifications';

import { creatureIds, creatures, type CreatureId } from '../domain/creatures';
import { weekdayInitial, weekdayShort } from '../domain/progress';
import { EVERY_DAY, type Habit, type NewHabit, type WeekdayMask } from '../domain/types';
import { CreatureBubble } from './CreatureBubble';
import { ReminderTimesField } from './ReminderTimesField';

const WEEKDAYS: WeekdayMask = 0b0111110;

type HabitEditorSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Edit this habit; create a new one when omitted. */
  habit?: Habit | null;
  onSubmit: (input: NewHabit) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function HabitEditorSheet({ visible, onClose, habit, ...actions }: HabitEditorSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={habit ? 'Editar hábito' : 'Novo hábito'}>
      {/* Remount for each opening so the form starts from the habit's current values. */}
      {visible ? <HabitForm habit={habit} onClose={onClose} {...actions} /> : null}
    </Sheet>
  );
}

function HabitForm({ habit, onClose, onSubmit, onDelete }: Omit<HabitEditorSheetProps, 'visible'>) {
  const [name, setName] = useState(habit?.name ?? '');
  const [creature, setCreature] = useState<CreatureId>(habit?.creature ?? 'turtle');
  const [days, setDays] = useState<WeekdayMask>(habit?.days ?? EVERY_DAY);
  const [reminderTimes, setReminderTimes] = useState<string[]>(habit?.reminderTimes ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSubmit({ name, creature, days, reminderTimes });
      // Ask in context: only when the person has just set a reminder.
      if (reminderTimes.length > 0) await requestNotificationPermission();
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
        placeholder="Beber água, Ler, Academia…"
        error={error ?? undefined}
        autoFocus={!habit}
        returnKeyType="done"
        maxLength={60}
      />

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
          Criatura · {creatures[creature].name}
        </Text>
        <CreaturePicker value={creature} onChange={setCreature} />
      </View>

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
          Quando
        </Text>
        <View style={styles.presets}>
          <Chip label="Todo dia" selected={days === EVERY_DAY} onPress={() => setDays(EVERY_DAY)} />
          <Chip label="Dias úteis" selected={days === WEEKDAYS} onPress={() => setDays(WEEKDAYS)} />
        </View>
        <WeekdayPicker
          value={days}
          onChange={setDays}
          tone={listColors[creatures[creature].color]}
        />
      </View>

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
          Lembretes
        </Text>
        <ReminderTimesField value={reminderTimes} onChange={setReminderTimes} />
      </View>

      <Button
        label={habit ? 'Salvar' : 'Criar hábito'}
        block
        loading={saving}
        disabled={name.trim().length === 0 || days === 0}
        onPress={save}
      />
      {habit && onDelete ? (
        <>
          <Button
            label="Apagar hábito"
            variant="danger"
            block
            onPress={() => setConfirmDelete(true)}
          />
          <ConfirmDialog
            visible={confirmDelete}
            title="Apagar este hábito?"
            message="O histórico dele também some deste e dos seus outros aparelhos."
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

function CreaturePicker({
  value,
  onChange,
}: {
  value: CreatureId;
  onChange: (creature: CreatureId) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.creatures} accessibilityRole="radiogroup">
      {creatureIds.map((id) => {
        const selected = id === value;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="radio"
            accessibilityLabel={creatures[id].name}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            style={[
              styles.creature,
              selected && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
            ]}
          >
            <CreatureBubble creature={id} size={48} done={selected} />
          </Pressable>
        );
      })}
    </View>
  );
}

function WeekdayPicker({
  value,
  onChange,
  tone,
}: {
  value: WeekdayMask;
  onChange: (days: WeekdayMask) => void;
  tone: { light: string; dark: string };
}) {
  const { colors, scheme } = useTheme();
  const color = tone[scheme];
  return (
    <View style={styles.weekdays}>
      {weekdayInitial.map((initial, i) => {
        const on = (value & (1 << i)) !== 0;
        return (
          <Pressable
            key={i}
            onPress={() => onChange(value ^ (1 << i))}
            accessibilityRole="checkbox"
            accessibilityLabel={weekdayShort[i]}
            accessibilityState={{ checked: on }}
            aria-checked={on}
            style={[
              styles.weekday,
              {
                backgroundColor: on ? color : 'transparent',
                borderColor: on ? color : withAlpha(color, 0.4),
              },
            ]}
          >
            <Text variant="headline" style={{ color: on ? colors.surfaceRaised : color }}>
              {initial}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl },
  group: { gap: spacing.sm },
  groupLabel: { marginLeft: spacing.xs },
  creatures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  creature: {
    padding: 4,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presets: { flexDirection: 'row', gap: spacing.sm },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
