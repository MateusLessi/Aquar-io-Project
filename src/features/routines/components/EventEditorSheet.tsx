import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { fromDateKey } from '@/core/dates';
import { requestNotificationPermission } from '@/core/notifications';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import {
  Button,
  CalendarMonth,
  Chip,
  ConfirmDialog,
  GlyphPicker,
  Sheet,
  Switch,
  Text,
  TextInput,
  TimePicker,
  glyphKey,
  listColorNames,
  listColors,
  radius,
  spacing,
  useTheme,
  type GlyphKey,
  type ListColorName,
} from '@/design-system';

import { toMinutes } from '../domain/schedule';
import type { AgendaEvent, EventRepeat, NewEvent } from '../domain/types';

const GLYPHS: GlyphKey[] = [
  'calendar',
  'graduation',
  'briefcase',
  'heart',
  'gift',
  'users',
  'plane',
  'pill',
  'music',
  'star',
  'flag',
  'bell',
];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const REPEATS: { value: EventRepeat; label: string }[] = [
  { value: 'none', label: 'Não repete' },
  { value: 'weekly', label: 'Toda semana' },
  { value: 'monthly', label: 'Todo mês' },
  { value: 'yearly', label: 'Todo ano' },
];
const REMINDERS: { value: number | null; label: string }[] = [
  { value: null, label: 'Sem lembrete' },
  { value: 0, label: 'Na hora' },
  { value: 15, label: '15 min antes' },
  { value: 60, label: '1 h antes' },
  { value: 1440, label: '1 dia antes' },
];

/** "terça, 17 de novembro". */
export const longDate = (key: string) => {
  const d = fromDateKey(key);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};

type EventEditorSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Edit this event; create a new one when omitted. */
  event?: AgendaEvent | null;
  /** The day a new event starts on. */
  date: string;
  todayKey: string;
  onSubmit: (input: NewEvent) => Promise<unknown>;
  onDelete?: () => Promise<void>;
};

export function EventEditorSheet({ visible, onClose, event, ...rest }: EventEditorSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={event ? 'Editar evento' : 'Novo evento'}>
      {visible ? <EventForm event={event} onClose={onClose} {...rest} /> : null}
    </Sheet>
  );
}

function EventForm({
  event,
  date: initialDate,
  todayKey,
  onClose,
  onSubmit,
  onDelete,
}: Omit<EventEditorSheetProps, 'visible'>) {
  const { colors, scheme } = useTheme();
  const { weekStart, showTime } = useCalendarPrefs();
  const [title, setTitle] = useState(event?.title ?? '');
  const [emoji, setEmoji] = useState<string | null>(glyphKey(event?.emoji) ?? 'calendar');
  const [color, setColor] = useState<ListColorName>(event?.color ?? 'coral');
  const [date, setDate] = useState(event?.date ?? initialDate);
  const [pickingDate, setPickingDate] = useState(false);
  const [allDay, setAllDay] = useState(event ? event.start === null : false);
  const [start, setStart] = useState(event?.start ?? '09:00');
  const [end, setEnd] = useState(event?.end ?? '10:00');
  const [editingTime, setEditingTime] = useState<'start' | 'end' | null>(null);
  const [repeat, setRepeat] = useState<EventRepeat>(event?.repeat ?? 'none');
  const [remindBefore, setRemindBefore] = useState<number | null>(event?.remindBefore ?? null);
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tone = listColors[color][scheme];
  const badTime = !allDay && toMinutes(end) <= toMinutes(start);

  const save = async () => {
    setSaving(true);
    try {
      await onSubmit({
        title,
        emoji,
        color,
        date,
        start: allDay ? null : start,
        end: allDay ? null : end,
        repeat,
        remindBefore,
        notes,
        listId: event?.listId ?? null,
      });
      if (remindBefore !== null) await requestNotificationPermission();
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
        label="Nome do evento"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          setError(null);
        }}
        placeholder="Prova, consulta, aniversário…"
        error={error ?? undefined}
        autoFocus={!event}
        maxLength={80}
      />

      <Group label="Quando">
        <Pressable
          onPress={() => setPickingDate((p) => !p)}
          accessibilityRole="button"
          accessibilityLabel={`Data: ${longDate(date)}`}
          style={[
            styles.field,
            {
              borderColor: pickingDate ? tone : colors.border,
              backgroundColor: colors.surfaceRaised,
            },
          ]}
        >
          <Text variant="caption" tone="secondary">
            Data
          </Text>
          <Text variant="headline">{longDate(date)}</Text>
        </Pressable>
        {pickingDate ? (
          <CalendarMonth
            value={date}
            today={todayKey}
            weekStart={weekStart}
            onChange={(value) => {
              setDate(value);
              setPickingDate(false);
            }}
          />
        ) : null}
        <View style={styles.switchRow}>
          <Text variant="body" style={styles.flex}>
            O dia todo
          </Text>
          <Switch label="O dia todo" value={allDay} onChange={setAllDay} />
        </View>
        {allDay ? null : (
          <>
            <View style={styles.times}>
              {(['start', 'end'] as const).map((which) => (
                <Pressable
                  key={which}
                  onPress={() => setEditingTime(editingTime === which ? null : which)}
                  accessibilityRole="button"
                  accessibilityLabel={`${which === 'start' ? 'Começa' : 'Termina'} às ${showTime(which === 'start' ? start : end)}`}
                  style={[
                    styles.field,
                    styles.flex,
                    {
                      borderColor: editingTime === which ? tone : colors.border,
                      backgroundColor: colors.surfaceRaised,
                    },
                  ]}
                >
                  <Text variant="caption" tone="secondary">
                    {which === 'start' ? 'Começa' : 'Termina'}
                  </Text>
                  <Text variant="title2">{showTime(which === 'start' ? start : end)}</Text>
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
          </>
        )}
      </Group>

      <Group label="Repetir">
        <View style={styles.wrap}>
          {REPEATS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={repeat === option.value}
              onPress={() => setRepeat(option.value)}
            />
          ))}
        </View>
      </Group>

      <Group label="Lembrete">
        <View style={styles.wrap}>
          {REMINDERS.filter((r) => !allDay || r.value === null || r.value === 1440).map(
            (option) => (
              <Chip
                key={String(option.value)}
                label={allDay && option.value === 1440 ? 'Na véspera' : option.label}
                selected={remindBefore === option.value}
                onPress={() => setRemindBefore(option.value)}
              />
            ),
          )}
        </View>
      </Group>

      <Group label="Ícone e cor">
        <GlyphPicker options={GLYPHS} value={emoji} onChange={setEmoji} allowNone={false} />
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

      <TextInput
        label="Notas (opcional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Sala 204, levar documentos…"
        multiline
        maxLength={500}
      />

      <Button
        label={event ? 'Salvar' : 'Criar evento'}
        block
        loading={saving}
        disabled={title.trim().length === 0 || badTime}
        onPress={save}
      />
      {event && onDelete ? (
        <>
          <Button
            label="Apagar evento"
            variant="danger"
            block
            onPress={() => setConfirmDelete(true)}
          />
          <ConfirmDialog
            visible={confirmDelete}
            title="Apagar este evento?"
            message={
              event.repeat === 'none'
                ? 'Ele some deste e dos seus outros aparelhos.'
                : 'Todas as repetições somem, deste e dos seus outros aparelhos.'
            }
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
  swatch: { width: 40, height: 40, borderRadius: 20 },
  times: { flexDirection: 'row', gap: spacing.md },
  field: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, gap: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
