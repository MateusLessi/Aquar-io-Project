import { Check, ListChecks, Minus, Plus, Timer, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Chip,
  ConfirmDialog,
  IconButton,
  Sheet,
  Slider,
  Text,
  TextInput,
  listColors,
  radius,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';

import { requestNotificationPermission } from '@/core/notifications';

import { kindInfo } from '../domain/amount';
import { creatureIds, creatures, type CreatureId } from '../domain/creatures';
import { weekdayInitial, weekdayShort } from '../domain/progress';
import {
  EVERY_DAY,
  habitKinds,
  type Habit,
  type HabitKind,
  type NewHabit,
  type WeekdayMask,
} from '../domain/types';
import { STEPS_MAX, TARGET_MAX } from '../domain/validation';
import { CreatureBubble } from './CreatureBubble';
import { HabitCapsule } from './HabitCapsule';
import { ReminderTimesField } from './ReminderTimesField';

const KIND_ICONS = { check: Check, count: Plus, time: Timer, checklist: ListChecks } as const;
const UNITS = ['copos', 'páginas', 'vezes', 'km', 'exercícios'];
const MINUTE_PRESETS = [10, 20, 30, 45, 60];
/** How full the preview capsule is for each kind, to show how it fills. */
const PREVIEW_RATIO: Record<HabitKind, number> = {
  check: 0,
  count: 0.4,
  time: 0.6,
  checklist: 0.5,
};

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
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? 'check');
  const [count, setCount] = useState(habit?.kind === 'count' ? habit.target : 8);
  const [unit, setUnit] = useState(habit?.unit ?? '');
  const [minutes, setMinutes] = useState(habit?.kind === 'time' ? habit.target : 20);
  const [steps, setSteps] = useState<{ id?: string; title: string }[]>(habit?.steps ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSubmit({
        name,
        creature,
        days,
        reminderTimes,
        kind,
        target: kind === 'count' ? count : kind === 'time' ? minutes : undefined,
        unit: kind === 'count' ? unit : null,
        steps: kind === 'checklist' ? steps : [],
      });
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
          Tipo
        </Text>
        <KindPicker value={kind} onChange={setKind} />
        <View style={styles.preview}>
          <HabitCapsule
            creature={creature}
            stage="young"
            ratio={PREVIEW_RATIO[kind]}
            done={kind === 'check'}
            width={44}
            height={58}
          />
          <Text variant="footnote" tone="secondary" style={styles.flex}>
            {kindInfo[kind].hint}.{' '}
            {kind === 'check'
              ? 'A cápsula enche de uma vez.'
              : 'A água sobe conforme você avança e a criatura sobe junto.'}
          </Text>
        </View>
      </View>

      {kind === 'count' ? (
        <View style={styles.group}>
          <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
            Meta por dia
          </Text>
          <Stepper value={count} onChange={setCount} min={1} max={TARGET_MAX.count} />
          <TextInput
            label="Unidade (opcional)"
            value={unit}
            onChangeText={setUnit}
            placeholder="copos, páginas…"
            maxLength={20}
          />
          <View style={styles.presets}>
            {UNITS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={unit === option}
                onPress={() => setUnit(unit === option ? '' : option)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {kind === 'time' ? (
        <View style={styles.group}>
          <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
            Meta por dia
          </Text>
          <Text variant="title1" style={styles.center}>
            {minutes} min
          </Text>
          <Slider
            label="Meta em minutos"
            value={minutes}
            onChange={setMinutes}
            min={5}
            max={180}
            step={5}
            valueText={(v) => `${v} minutos`}
          />
          <View style={styles.presets}>
            {MINUTE_PRESETS.map((option) => (
              <Chip
                key={option}
                label={`${option}`}
                selected={minutes === option}
                onPress={() => setMinutes(option)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {kind === 'checklist' ? (
        <View style={styles.group}>
          <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
            Passos · recomeçam todo dia
          </Text>
          <StepsField value={steps} onChange={setSteps} />
        </View>
      ) : null}

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
        disabled={
          name.trim().length === 0 ||
          days === 0 ||
          (kind === 'checklist' && !steps.some((s) => s.title.trim()))
        }
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

function KindPicker({ value, onChange }: { value: HabitKind; onChange: (k: HabitKind) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.kinds} accessibilityRole="radiogroup">
      {habitKinds.map((kind) => {
        const selected = kind === value;
        const Icon = KIND_ICONS[kind];
        return (
          <Pressable
            key={kind}
            onPress={() => onChange(kind)}
            accessibilityRole="radio"
            accessibilityLabel={`${kindInfo[kind].label}: ${kindInfo[kind].hint}`}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            style={({ pressed }) => [
              styles.kind,
              {
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected
                  ? colors.accentSoft
                  : pressed
                    ? colors.surfacePressed
                    : 'transparent',
              },
            ]}
          >
            <Icon size={20} color={selected ? colors.accent : colors.textSecondary} />
            <Text variant="caption" tone={selected ? 'primary' : 'secondary'} style={styles.bold}>
              {kindInfo[kind].label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <View style={styles.stepper}>
      <IconButton
        icon={Minus}
        label="Diminuir meta"
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      />
      <Text
        variant="title1"
        style={styles.stepperValue}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Meta: ${value}`}
      >
        {value}
      </Text>
      <IconButton
        icon={Plus}
        label="Aumentar meta"
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      />
    </View>
  );
}

function StepsField({
  value,
  onChange,
}: {
  value: { id?: string; title: string }[];
  onChange: (steps: { id?: string; title: string }[]) => void;
}) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');
  const add = () => {
    const title = draft.trim();
    if (!title || value.length >= STEPS_MAX) return;
    onChange([...value, { title }]);
    setDraft('');
  };
  return (
    <View style={styles.group}>
      {value.map((step, index) => (
        <View
          key={step.id ?? `new-${index}`}
          style={[styles.stepRow, { borderColor: colors.separator }]}
        >
          <Text variant="body" style={styles.flex}>
            {index + 1}. {step.title}
          </Text>
          <Pressable
            onPress={() => onChange(value.filter((_, i) => i !== index))}
            accessibilityRole="button"
            accessibilityLabel={`Remover ${step.title}`}
            hitSlop={10}
          >
            <X size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
      ))}
      {value.length < STEPS_MAX ? (
        <>
          <TextInput
            label="Novo passo"
            value={draft}
            onChangeText={setDraft}
            placeholder="Limpar, Tônico, Hidratante…"
            returnKeyType="done"
            onSubmitEditing={add}
            submitBehavior="submit"
            maxLength={60}
          />
          <Button
            label="Adicionar passo"
            variant="secondary"
            disabled={!draft.trim()}
            onPress={add}
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
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kinds: { flexDirection: 'row', gap: spacing.sm },
  kind: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  bold: { fontWeight: '700' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  stepperValue: { minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.xs,
  },
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
