import {
  Check,
  ChevronLeft,
  Folder,
  ListChecks,
  Plus,
  Repeat,
  Timer,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Chip,
  ConfirmDialog,
  Dial,
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
import { weekdayOrder } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import { useSetting } from '@/core/settings/useSetting';

import { kindInfo } from '../domain/amount';
import { DRINK_UNITS, totalLabel, type HabitPreset } from '../domain/catalog';
import {
  DEFAULT_CREATURE_SETTING,
  creatureIds,
  creatures,
  isCreatureId,
  type CreatureId,
} from '../domain/creatures';
import { daysLabel, weekdayInitial, weekdayShort } from '../domain/progress';
import { emptySourceDraft, useHabitSources, type SourceDraft } from '../hooks/habitSources';
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
import { HabitCatalog } from './HabitCatalog';
import { HabitCapsule } from './HabitCapsule';
import { ReminderTimesField } from './ReminderTimesField';

const KIND_ICONS = { check: Check, count: Plus, time: Timer, checklist: ListChecks } as const;
const UNITS = ['copos', 'páginas', 'vezes', 'km', 'exercícios'];
const MINUTE_PRESETS = [5, 10, 15, 20, 30, 45, 60];
/** How full the preview capsule is for each kind, to show how it fills. */
const PREVIEW_RATIO: Record<HabitKind, number> = {
  check: 0,
  count: 0.4,
  time: 0.6,
  checklist: 0.5,
};

const WEEKDAYS: WeekdayMask = 0b0111110;
const WEEKEND: WeekdayMask = 0b1000001;

type HabitEditorSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Edit this habit; create a new one when omitted. */
  habit?: Habit | null;
  /** Saves the habit; returns the new habit's id when creating one. */
  onSubmit: (input: NewHabit) => Promise<string | void>;
  onDelete?: () => Promise<void>;
};

export function HabitEditorSheet({ visible, onClose, habit, ...actions }: HabitEditorSheetProps) {
  // A new habit starts from the catalog: a model, or from scratch (null).
  const [start, setStart] = useState<{ preset: HabitPreset | null } | null>(null);
  const close = () => {
    setStart(null);
    onClose();
  };
  const choosing = !habit && start === null;
  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={
        habit ? 'Editar hábito' : choosing ? 'Novo hábito' : (start?.preset?.name ?? 'Novo hábito')
      }
    >
      {/* Remount for each opening so the form starts from the habit's current values. */}
      {!visible ? null : choosing ? (
        <HabitCatalog onPick={(preset) => setStart({ preset })} />
      ) : (
        <HabitForm
          key={start?.preset?.id ?? 'zero'}
          habit={habit}
          preset={start?.preset ?? null}
          onBackToCatalog={habit ? undefined : () => setStart(null)}
          onClose={close}
          {...actions}
        />
      )}
    </Sheet>
  );
}

function HabitForm({
  habit,
  preset,
  onBackToCatalog,
  onClose,
  onSubmit,
  onDelete,
}: Omit<HabitEditorSheetProps, 'visible'> & {
  /** The model a new habit starts from. */
  preset: HabitPreset | null;
  onBackToCatalog?: () => void;
}) {
  const { colors, scheme } = useTheme();
  const [name, setName] = useState(habit?.name ?? preset?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? preset?.description ?? '');
  const [storedCreature] = useSetting<string>(DEFAULT_CREATURE_SETTING, 'turtle');
  const [creature, setCreature] = useState<CreatureId>(
    habit?.creature ??
      preset?.creature ??
      (isCreatureId(storedCreature) ? storedCreature : 'turtle'),
  );
  // The stored default may arrive after the first render: a new habit follows it until the
  // person picks a creature.
  const [seenDefault, setSeenDefault] = useState(storedCreature);
  if (storedCreature !== seenDefault) {
    setSeenDefault(storedCreature);
    if (!habit && !preset && creature === seenDefault && isCreatureId(storedCreature))
      setCreature(storedCreature);
  }
  const [days, setDays] = useState<WeekdayMask>(habit?.days ?? preset?.days ?? EVERY_DAY);
  const [reminderTimes, setReminderTimes] = useState<string[]>(
    habit?.reminderTimes ?? preset?.reminderTimes ?? [],
  );
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? preset?.kind ?? 'check');
  const [count, setCount] = useState(
    habit?.kind === 'count' ? habit.target : preset?.kind === 'count' ? (preset.target ?? 8) : 8,
  );
  const [unit, setUnit] = useState(habit?.unit ?? preset?.unit ?? '');
  const [minutes, setMinutes] = useState(
    habit?.kind === 'time' ? habit.target : preset?.kind === 'time' ? (preset.target ?? 20) : 20,
  );
  const [steps, setSteps] = useState<{ id?: string; title: string }[]>(
    habit?.steps ?? preset?.steps?.map((title) => ({ title })) ?? [],
  );
  // Drinks: units that add up ("8 copos de 250 ml = 2 litros").
  const unitOptions =
    preset?.units ?? (DRINK_UNITS.some((u) => u.unit === unit) ? DRINK_UNITS : null);
  const unitOption = unitOptions?.find((u) => u.unit === unit);
  const total = kind === 'count' ? totalLabel(count, unitOption) : null;
  const tone = listColors[creatures[creature].color][scheme];
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Where it is done from: on its own (null), or a list, folder or routine.
  const sources = useHabitSources();
  const [initialSource] = useState(() => (habit && sources ? sources.sourceOf(habit.id) : null));
  const [source, setSource] = useState<SourceDraft | null>(initialSource);
  const effectiveDays = source?.days ?? days;

  const save = async () => {
    setSaving(true);
    try {
      const created = await onSubmit({
        name,
        description,
        creature,
        days: effectiveDays,
        reminderTimes,
        // A connected habit is done by its items: its own kind is a simple check.
        kind: source ? 'check' : kind,
        target: source
          ? undefined
          : kind === 'count'
            ? count
            : kind === 'time'
              ? minutes
              : undefined,
        unit: !source && kind === 'count' ? unit : null,
        steps: !source && kind === 'checklist' ? steps : [],
      });
      const id = habit?.id ?? (typeof created === 'string' ? created : null);
      if (sources && id && (source || initialSource)) await sources.saveSource(id, source);
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
      {onBackToCatalog ? (
        <View style={styles.back}>
          <Button
            label="Ver os modelos"
            variant="ghost"
            icon={ChevronLeft}
            onPress={onBackToCatalog}
          />
        </View>
      ) : null}
      {/* The creature, in its color, changing as the habit takes shape. */}
      <View
        style={[styles.hero, { backgroundColor: withAlpha(tone, scheme === 'dark' ? 0.18 : 0.14) }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <CreatureBubble creature={creature} size={84} done />
        <Text variant="headline" numberOfLines={1} style={{ color: colors.textPrimary }}>
          {name.trim() || 'Seu hábito'}
        </Text>
      </View>
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
      <TextInput
        label="Por quê? (opcional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Para ter energia à tarde"
        maxLength={140}
      />

      {sources ? (
        <View style={styles.group}>
          <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
            Como ele é concluído?
          </Text>
          <SourceTiles value={source} onChange={setSource} />
          {source ? <sources.SourcePicker value={source} onChange={setSource} /> : null}
        </View>
      ) : null}

      {source ? null : (
        <>
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
                  : 'A água sobe conforme você avança.'}
              </Text>
            </View>
          </View>

          {kind === 'count' ? (
            <View style={styles.group}>
              <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
                Meta por dia
              </Text>
              <Dial
                label="Meta do dia"
                value={count}
                onChange={setCount}
                min={1}
                max={TARGET_MAX.count}
                perTurn={12}
                unit={unit || 'vezes'}
                tone={tone}
              />
              {total ? (
                <Text variant="headline" style={styles.center}>
                  {total}
                </Text>
              ) : null}
              <View style={styles.presets}>
                {unitOptions
                  ? unitOptions.map((option) => (
                      <Chip
                        key={option.unit}
                        label={option.label}
                        selected={unit === option.unit}
                        onPress={() => {
                          // Same amount to drink in the new unit, as close as it gets.
                          const ml = count * (unitOption?.ml ?? option.ml ?? 1);
                          setUnit(option.unit);
                          setCount(Math.max(1, Math.round(ml / (option.ml ?? 1))));
                        }}
                      />
                    ))
                  : UNITS.map((option) => (
                      <Chip
                        key={option}
                        label={option}
                        selected={unit === option}
                        onPress={() => setUnit(unit === option ? '' : option)}
                      />
                    ))}
              </View>
              <TextInput
                label="Unidade (opcional)"
                value={unit}
                onChangeText={setUnit}
                placeholder="copos, páginas…"
                maxLength={20}
              />
            </View>
          ) : null}

          {kind === 'time' ? (
            <View style={styles.group}>
              <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
                Meta por dia
              </Text>
              <Dial
                label="Duração"
                value={minutes}
                onChange={setMinutes}
                min={5}
                max={TARGET_MAX.time}
                perTurn={60}
                step={5}
                unit="min"
                tone={tone}
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
        </>
      )}

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
        {source?.days != null ? (
          <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
            Nos dias {source.kind === 'routine' ? 'da rotina' : 'que têm lista'}:{' '}
            {daysLabel(source.days)}.
          </Text>
        ) : (
          <>
            <View style={styles.presets}>
              <Chip
                label="Todo dia"
                selected={days === EVERY_DAY}
                onPress={() => setDays(EVERY_DAY)}
              />
              <Chip
                label="Dias úteis"
                selected={days === WEEKDAYS}
                onPress={() => setDays(WEEKDAYS)}
              />
              <Chip
                label="Fim de semana"
                selected={days === WEEKEND}
                onPress={() => setDays(WEEKEND)}
              />
            </View>
            <WeekdayPicker
              value={days}
              onChange={setDays}
              tone={listColors[creatures[creature].color]}
            />
          </>
        )}
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
          effectiveDays === 0 ||
          (source ? !source.id : kind === 'checklist' && !steps.some((s) => s.title.trim()))
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

const SOURCE_TILES: {
  kind: SourceDraft['kind'] | null;
  title: string;
  hint: string;
  icon: typeof Check;
}[] = [
  { kind: null, title: 'Sozinho', hint: 'Um toque, contador ou tempo', icon: Check },
  { kind: 'list', title: 'Uma lista', hint: 'Os itens dela', icon: ListChecks },
  { kind: 'folder', title: 'Uma pasta', hint: 'Uma lista por dia', icon: Folder },
  { kind: 'routine', title: 'Uma rotina', hint: 'Os passos dela', icon: Repeat },
];

/** On its own, or done from a list, folder or routine. */
function SourceTiles({
  value,
  onChange,
}: {
  value: SourceDraft | null;
  onChange: (draft: SourceDraft | null) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.tiles} accessibilityRole="radiogroup">
      {SOURCE_TILES.map((tile) => {
        const selected = (value?.kind ?? null) === tile.kind;
        const Icon = tile.icon;
        return (
          <Pressable
            key={tile.title}
            onPress={() => onChange(tile.kind ? emptySourceDraft(tile.kind) : null)}
            accessibilityRole="radio"
            accessibilityLabel={`${tile.title}: ${tile.hint}`}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: selected
                  ? colors.accent
                  : pressed
                    ? colors.surfacePressed
                    : colors.waterline,
              },
            ]}
          >
            <Icon size={20} color={selected ? colors.onAccent : colors.textSecondary} />
            <Text
              variant="bodyStrong"
              style={{ color: selected ? colors.onAccent : colors.textPrimary }}
            >
              {tile.title}
            </Text>
            <Text
              variant="footnote"
              style={{ color: selected ? colors.onAccent : colors.textTertiary }}
            >
              {tile.hint}
            </Text>
          </Pressable>
        );
      })}
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
  const { weekStart } = useCalendarPrefs();
  const color = tone[scheme];
  return (
    <View style={styles.weekdays}>
      {weekdayOrder(weekStart).map((i) => {
        const initial = weekdayInitial[i]!;
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
  back: { alignSelf: 'flex-start', marginTop: -spacing.sm },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { flexBasis: '47%', flexGrow: 1, padding: spacing.md, borderRadius: radius.lg, gap: 2 },
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
