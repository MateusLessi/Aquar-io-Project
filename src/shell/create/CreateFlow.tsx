import {
  CalendarClock,
  CheckSquare,
  Fish,
  FolderPlus,
  ListTodo,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Grid,
  Sheet,
  Text,
  haptics,
  listColors,
  radius,
  spacing,
  useTheme,
  withAlpha,
  type ListColorName,
} from '@/design-system';
import { HabitEditorSheet } from '@/features/habits/components/HabitEditorSheet';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { RoutineEditorSheet } from '@/features/routines/components/RoutineEditorSheet';
import { tagsOf } from '@/features/routines/domain/schedule';
import { useRoutinesToday } from '@/features/routines/hooks/queries';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import { FolderEditorSheet } from '@/features/todo/components/FolderEditorSheet';
import { ListEditorSheet } from '@/features/todo/components/ListEditorSheet';
import { QuickAddSheet } from '@/features/todo/components/QuickAddSheet';

export type CreateKind = 'task' | 'habit' | 'routine' | 'list' | 'folder';

const options: {
  kind: CreateKind;
  label: string;
  hint: string;
  icon: LucideIcon;
  color: ListColorName;
}[] = [
  { kind: 'task', label: 'Tarefa', hint: 'Algo para fazer', icon: CheckSquare, color: 'lagoon' },
  { kind: 'habit', label: 'Hábito', hint: 'Uma criatura para cuidar', icon: Fish, color: 'sand' },
  {
    kind: 'routine',
    label: 'Rotina',
    hint: 'Um bloco do seu dia',
    icon: CalendarClock,
    color: 'tide',
  },
  { kind: 'list', label: 'Lista', hint: 'Para juntar tarefas', icon: ListTodo, color: 'anemone' },
  { kind: 'folder', label: 'Pasta', hint: 'Para separar listas', icon: FolderPlus, color: 'coral' },
];

type CreateFlowProps = {
  visible: boolean;
  onClose: () => void;
  /** Shown first and highlighted (e.g. the Aquarium tab that is open). */
  suggested?: CreateKind;
  /** New tasks go to this list when one is open. */
  defaultListId?: string;
  /** New lists and folders go into this folder when one is open. */
  defaultFolderId?: string;
  dueToday: boolean;
};

/**
 * The create button's flow: "What do you want to create?" with four big choices, then the
 * matching editor. Big targets and plain words, so anyone can find their way.
 */
export function CreateFlow({
  visible,
  onClose,
  suggested,
  defaultListId,
  defaultFolderId,
  dueToday,
}: CreateFlowProps) {
  const habits = useHabitsRepository();
  const routines = useRoutinesRepository();
  const { data: routineList } = useRoutinesToday();
  const [kind, setKind] = useState<CreateKind | null>(null);
  const close = () => {
    setKind(null);
    onClose();
  };
  // Folders are offered where lists live: in Listas and inside a folder.
  const available = options.filter((o) => o.kind !== 'folder' || suggested === 'list');
  const ordered = suggested
    ? [
        ...available.filter((o) => o.kind === suggested),
        ...available.filter((o) => o.kind !== suggested),
      ]
    : available;

  return (
    <>
      <Sheet visible={visible && kind === null} onClose={close} title="O que você quer criar?">
        <Grid columns={2} gap={spacing.md}>
          {ordered.map((option) => (
            <ChoiceCard
              key={option.kind}
              {...option}
              highlighted={option.kind === suggested}
              onPress={() => {
                haptics.selection();
                setKind(option.kind);
              }}
            />
          ))}
        </Grid>
      </Sheet>

      <QuickAddSheet
        visible={visible && kind === 'task'}
        onClose={close}
        defaultListId={defaultListId}
        dueToday={dueToday}
      />
      <HabitEditorSheet
        visible={visible && kind === 'habit'}
        onClose={close}
        onSubmit={async (input) => {
          await habits.createHabit(input);
        }}
      />
      <RoutineEditorSheet
        visible={visible && kind === 'routine'}
        tagSuggestions={tagsOf(routineList)}
        onClose={close}
        onSubmit={async (input) => {
          await routines.createRoutine(input);
        }}
      />
      <ListEditorSheet
        visible={visible && kind === 'list'}
        onClose={close}
        folderId={defaultFolderId ?? null}
      />
      <FolderEditorSheet
        visible={visible && kind === 'folder'}
        onClose={close}
        parentId={defaultFolderId ?? null}
      />
    </>
  );
}

function ChoiceCard({
  label,
  hint,
  icon: Icon,
  color,
  highlighted,
  onPress,
}: (typeof options)[number] & { highlighted: boolean; onPress: () => void }) {
  const { colors, scheme } = useTheme();
  const tone = listColors[color][scheme];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Criar ${label.toLowerCase()}: ${hint}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: withAlpha(tone, highlighted ? 0.9 : 0.35),
          borderWidth: highlighted ? 2 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(tone, highlighted ? 0.2 : 0.1) },
        ]}
      />
      <View style={[styles.icon, { backgroundColor: withAlpha(tone, 0.25) }]}>
        <Icon size={28} color={tone} strokeWidth={2.2} />
      </View>
      <Text variant="title2">{label}</Text>
      <Text variant="footnote" tone="secondary">
        {hint}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 150,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
